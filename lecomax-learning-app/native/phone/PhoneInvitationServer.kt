package com.lecomax.learning

import fi.iki.elonen.NanoHTTPD
import org.json.JSONObject
import java.security.SecureRandom

/** A short-lived rendezvous on the viewing phone. No screen capture or public listener. */
class PhoneInvitationServer(
    val address: String,
    private val clock: () -> Long = { System.nanoTime() / 1000000 },
    private val allowedPeer: (String) -> Boolean = { PhoneDirectServer.isTailnet(it) },
) : NanoHTTPD(address, 8093) {
    val token = ByteArray(32).also { SecureRandom().nextBytes(it) }.joinToString("") { "%02x".format(it) }
    private val born = clock()
    private var pair = ""
    private var cancelled = false
    @Synchronized fun expired() = cancelled || clock() - born >= 600000
    @Synchronized fun result(): String = if (expired()) "" else pair
    @Synchronized fun cancel() { cancelled = true; pair = ""; stop() }
    @Synchronized override fun serve(session: IHTTPSession): Response {
        var status = Response.Status.FORBIDDEN
        if (!expired() && allowedPeer(session.remoteIpAddress) && session.remoteIpAddress != address &&
            session.headers["host"] == "$address:8093" && session.headers["origin"] == null &&
            session.uri == "/accept" && session.method == Method.POST &&
            session.headers["authorization"] == "Bearer $token") {
            val code = session.headers["x-pairing-code"] ?: ""
            if (Regex("[a-f0-9]{32}").matches(code)) {
                val next = "http://${session.remoteIpAddress}:8092|$code"
                if (pair.isEmpty() || pair == next) { pair = next; status = Response.Status.OK }
            }
        }
        return newFixedLengthResponse(status, "application/json", JSONObject().put("accepted", status == Response.Status.OK).toString()).apply {
            addHeader("Cache-Control", "no-store"); addHeader("Referrer-Policy", "no-referrer")
        }
    }
}
