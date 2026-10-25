package com.lecomax.learning

import fi.iki.elonen.NanoHTTPD
import org.json.JSONObject
import java.net.NetworkInterface
import java.security.SecureRandom

/** Listens only on the VPN address, never on Wi-Fi or public interfaces. */
class PhoneDirectServer(
    private val readAsset: (String) -> String,
    private val isLocked: () -> Boolean,
    val address: String,
    private val onRequest: () -> Unit,
    private val onControl: (JSONObject) -> Unit,
    private val onEnd: () -> Unit,
    private val clock: () -> Long = { System.nanoTime() / 1000000 },
    private val allowedPeer: (String) -> Boolean = { isTailnet(it) },
    rememberedToken: String = "",
    private val remember: (String) -> Unit = {},
    private val viewOnly: Boolean = false,
) : NanoHTTPD(address, 8092) {
    companion object {
        fun tailscaleAddress(): String? = runCatching { NetworkInterface.getNetworkInterfaces()?.toList()
            ?.filter { it.isUp && it.name.startsWith("tun") }?.flatMap { it.inetAddresses.toList() }
            ?.mapNotNull { it.hostAddress }?.firstOrNull { isTailnet(it) } }.getOrNull()
        fun isTailnet(value: String): Boolean {
            val p = value.split('.').map { it.toIntOrNull() ?: return false }
            return p.size == 4 && p[0] == 100 && p[1] in 64..127 && p[2] in 0..255 && p[3] in 0..255
        }
        private fun secret() = ByteArray(16).also { SecureRandom().nextBytes(it) }.joinToString("") { "%02x".format(it) }
    }
    val pairingCode = secret()
    private val born = clock()
    private var token = rememberedToken.takeIf { Regex("[a-f0-9]{32}").matches(it) } ?: ""
    private var approved = token.isNotEmpty()
    private var paused = approved
    private var ended = false
    private var lastSeen = born
    private var attempts = 0
    private var lastControl = 0L
    private var quickCode = ""
    private var quickBorn = 0L
    private var joinedRequest = ""
    private var joinedPeer = ""
    private var joinedCode = ""
    @Synchronized fun enableQuickPairing(): String {
        check(!expired() && token.isEmpty()) { "Start a new sharing session first." }
        quickCode = secret(); quickBorn = clock()
        return quickCode
    }
    @Synchronized fun disableQuickPairing() { quickCode = "" }
    @Volatile var frame: ByteArray? = null
    @Synchronized fun approve() { if (token.isNotEmpty() && !expired()) { remember(token); approved = true } }
    // Approved sessions belong to the user until explicitly stopped. The heartbeat
    // gates live frames/input, but must not revoke approval while an app is hidden.
    @Synchronized fun expired(): Boolean = ended ||
        (token.isEmpty() && clock() - born > 10 * 60 * 1000L) ||
        (token.isNotEmpty() && !approved && clock() - born > 10 * 60 * 1000L)
    @Synchronized fun isStreaming(): Boolean = approved && !paused && !expired() && clock() - lastSeen <= 15000
    @Synchronized fun hasApproval(): Boolean = approved && !ended
    @Synchronized fun invalidate(forget: Boolean = true) { if (forget) remember(""); ended = true; approved = false; token = ""; quickCode = ""; frame = null }
    private fun response(status: Response.Status, text: String, mime: String = "application/json"): Response =
        secure(newFixedLengthResponse(status, mime, text))
    private fun secure(r: Response): Response {
        r.addHeader("Cache-Control", "no-store")
        r.addHeader("X-Content-Type-Options", "nosniff")
        r.addHeader("Referrer-Policy", "no-referrer")
        r.addHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; img-src blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
        return r
    }
    @Synchronized override fun serve(session: IHTTPSession): Response {
        val denied = Response.Status.FORBIDDEN
        if (expired() || !allowedPeer(session.remoteIpAddress) || session.headers["host"] != "$address:8092") return response(denied, "{}")
        val origin = session.headers["origin"]
        if (origin != null && origin != "http://$address:8092") return response(denied, "{}")
        val assets = mapOf("/" to ("direct.html" to "text/html; charset=utf-8"), "/direct.js" to ("direct.js" to "text/javascript"), "/viewer.css" to ("viewer.css" to "text/css"))
        if (session.method == Method.GET && assets.containsKey(session.uri)) {
            val asset = assets.getValue(session.uri)
            return response(Response.Status.OK, readAsset(asset.first), asset.second)
        }
        if (session.uri == "/join" && session.method == Method.POST) {
            val supplied = session.headers["x-pairing-code"]
            val requestId = session.headers["x-pairing-request"] ?: ""
            // A dropped HTTP response must not consume a one-use QR irrecoverably.
            // Only the identical random attempt from the same peer can recover it.
            if (token.isNotEmpty() && joinedRequest.isNotEmpty() && requestId == joinedRequest && supplied == joinedCode && session.remoteIpAddress == joinedPeer) {
                return response(Response.Status.OK, JSONObject().put("token", token).toString())
            }
            val quick = quickCode.isNotEmpty() && supplied == quickCode && clock() - quickBorn <= 120000
            if (token.isNotEmpty() || ++attempts > 20 || (!quick && supplied != pairingCode)) return response(denied, "{}")
            joinedRequest = if (Regex("[a-f0-9]{32}").matches(requestId)) requestId else ""
            joinedPeer = session.remoteIpAddress; joinedCode = supplied ?: ""
            val next = secret()
            if (quick) try { remember(next) } catch (_: Exception) { return response(Response.Status.INTERNAL_ERROR, "{}") }
            token = next; approved = quick; quickCode = ""; lastSeen = clock(); onRequest()
            return response(Response.Status.OK, JSONObject().put("token", token).toString())
        }
        if (token.isEmpty() || session.headers["authorization"] != "Bearer $token") return response(denied, "{}")
        if (session.uri == "/stop" && session.method == Method.POST) { invalidate(); onEnd(); return response(Response.Status.OK, "{}") }
        if (session.uri == "/pause" && session.method == Method.POST) {
            if (!paused) lastSeen = clock()
            paused = true; frame = null
            return response(Response.Status.OK, "{}")
        }
        if (session.uri == "/status" && session.method == Method.GET) {
            if (paused || clock() - lastSeen > 15000) frame = null
            paused = false; lastSeen = clock()
            return response(Response.Status.OK, JSONObject().put("approved", approved).put("viewOnly", viewOnly).toString())
        }
        if (!isStreaming()) return response(Response.Status.CONFLICT, "{}")
        if (session.uri == "/frame" && session.method == Method.GET) {
            val bytes = if (isLocked()) null else frame
            return if (bytes == null) response(Response.Status.NO_CONTENT, "") else secure(newFixedLengthResponse(Response.Status.OK, "image/jpeg", bytes.inputStream(), bytes.size.toLong()))
        }
        if (session.uri == "/control" && session.method == Method.POST) {
            if (viewOnly) return response(denied, "{}")
            if (isLocked()) return response(Response.Status.CONFLICT, "{}")
            val control = session.headers["x-control"] ?: return response(denied, "{}")
            if (control.length > 1024) return response(Response.Status.BAD_REQUEST, "{}")
            if (clock() - lastControl < 40) return response(Response.Status.TOO_MANY_REQUESTS, "{}")
            try { val m = JSONObject(control); lastControl = clock(); onControl(m) }
            catch (_: Exception) { return response(Response.Status.BAD_REQUEST, "{}") }
            return response(Response.Status.OK, "{}")
        }
        return response(Response.Status.NOT_FOUND, "{}")
    }
}
