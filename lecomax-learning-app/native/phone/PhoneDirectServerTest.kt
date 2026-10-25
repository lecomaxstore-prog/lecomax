package com.lecomax.learning

import org.junit.Assert.*
import org.junit.Test
import org.json.JSONObject
import java.net.Socket

class PhoneDirectServerTest {
    @Test fun approvedPairingSurvivesHostRestartUntilExplicitDisconnect() {
        var saved = ""
        fun host() = PhoneDirectServer({ "viewer" }, { false }, "127.0.0.1", {}, {}, {},
            allowedPeer = { true }, rememberedToken = saved, remember = { saved = it }).also { it.start(2000, true) }
        val first = host()
        val token: String
        try {
            token = join(first)
            assertEquals("", saved)
            first.approve()
            assertEquals(token, saved)
            first.invalidate(false)
            assertEquals(token, saved)
        } finally { first.stop() }
        val resumed = host()
        try {
            assertTrue(resumed.hasApproval())
            assertFalse(resumed.isStreaming())
            assertEquals(200, request("/status", token = token).first)
            assertTrue(resumed.isStreaming())
            assertEquals(403, request("/status", token = "wrong").first)
            assertEquals(200, request("/stop", "POST", token).first)
            assertEquals("", saved)
        } finally { resumed.stop() }
        val forgotten = host()
        try { assertFalse(forgotten.hasApproval()); assertEquals(403, request("/status", token = token).first) }
        finally { forgotten.stop() }
    }
    private var time = 1000L
    @Test fun viewOnlyRejectsAllControlEvenAfterApproval() {
        val server = PhoneDirectServer({ "viewer" }, { false }, "127.0.0.1", {}, { controls++ }, {},
            allowedPeer = { true }, viewOnly = true).also { it.start(2000, true) }
        try {
            val token = join(server)
            assertEquals(409, request("/frame", token = token).first)
            server.approve()
            val status = JSONObject(request("/status", token = token).second)
            assertTrue(status.getBoolean("approved")); assertTrue(status.getBoolean("viewOnly"))
            server.frame = "view-only-frame".toByteArray()
            assertEquals("view-only-frame", request("/frame", token = token).second)
            for (action in listOf("home", "back", "recents", "gesture")) {
                assertEquals(403, request("/control", "POST", token, mapOf("X-Control" to "{\"action\":\"$action\"}")).first)
            }
            assertEquals(0, controls)
            assertEquals(200, request("/stop", "POST", token).first)
            assertEquals(403, request("/frame", token = token).first)
        } finally { server.stop() }
    }
    @Test fun invitationAuthenticatesExpiresAndAcceptsOnlyOnePeerAndCode() {
        var now = 1000L
        val server = PhoneInvitationServer("127.0.0.2", { now }, { true }).also { it.start(2000, true) }
        fun accept(token: String, code: String, origin: Boolean = false): Int = Socket("127.0.0.2", 8093).use { socket ->
            socket.soTimeout = 2000
            val headers = "POST /accept HTTP/1.1\r\nHost: 127.0.0.2:8093\r\nAuthorization: Bearer $token\r\nX-Pairing-Code: $code\r\n" +
                (if (origin) "Origin: https://evil.example\r\n" else "") + "Connection: close\r\nContent-Length: 0\r\n\r\n"
            socket.getOutputStream().write(headers.toByteArray()); socket.getOutputStream().flush()
            socket.getInputStream().bufferedReader().readLine().split(' ')[1].toInt()
        }
        try {
            val code = "a".repeat(32)
            assertEquals(403, accept("wrong", code)); assertEquals("", server.result())
            assertEquals(403, accept(server.token, code, true))
            assertEquals(403, accept(server.token, "invalid"))
            assertEquals(200, accept(server.token, code))
            assertEquals("http://127.0.0.1:8092|$code", server.result())
            assertEquals(200, accept(server.token, code))
            assertEquals(403, accept(server.token, "b".repeat(32)))
            now += 600000
            assertEquals(403, accept(server.token, code)); assertEquals("", server.result())
            server.cancel(); assertTrue(server.expired())
        } finally { server.stop() }
    }
    private var locked = false
    private var requests = 0
    private var controls = 0
    private var stopped = false
    private fun server(allow: Boolean = true) = PhoneDirectServer(
        { "<html>viewer</html>" }, { locked }, "127.0.0.1",
        { requests++ }, { controls++ }, { stopped = true }, { time }, { allow }
    ).also { it.start(2000, true) }
    private fun request(path: String, method: String = "GET", token: String = "", headers: Map<String, String> = emptyMap()): Pair<Int, String> {
        // Use a real raw request: HttpURLConnection silently strips the Origin header.
        return Socket("127.0.0.1", 8092).use { socket ->
            socket.soTimeout = 2000
            val lines = mutableListOf("$method $path HTTP/1.1", "Host: 127.0.0.1:8092", "Connection: close", "Content-Length: 0")
            if (token.isNotEmpty()) lines.add("Authorization: Bearer $token")
            headers.forEach { (key, value) -> lines.add("$key: $value") }
            socket.getOutputStream().write((lines.joinToString("\r\n") + "\r\n\r\n").toByteArray())
            socket.getOutputStream().flush()
            val result = socket.getInputStream().bufferedReader().readText()
            result.substringBefore("\r\n").split(' ')[1].toInt() to result.substringAfter("\r\n\r\n", "")
        }
    }
    private fun join(server: PhoneDirectServer): String {
        val result = request("/join", "POST", headers = mapOf("X-Pairing-Code" to server.pairingCode))
        assertEquals(200, result.first)
        return JSONObject(result.second).getString("token")
    }
    @Test fun approvalAuthenticationLockAndStop() {
        val server = server()
        try {
            assertEquals(403, request("/frame").first)
            assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to "wrong")).first)
            val token = join(server)
            assertEquals(1, requests)
            assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to server.pairingCode)).first)
            assertEquals(409, request("/frame", token = token).first)
            assertEquals(409, request("/control", "POST", token, mapOf("X-Control" to "{}" )).first)
            assertEquals(0, controls)
            server.approve(); server.frame = "jpeg-test".toByteArray()
            assertTrue(JSONObject(request("/status", token = token).second).getBoolean("approved"))
            assertEquals("jpeg-test", request("/frame", token = token).second)
            locked = true; assertEquals(204, request("/frame", token = token).first)
            assertEquals(409, request("/control", "POST", token, mapOf("X-Control" to "{\"action\":\"home\"}")).first)
            locked = false
            assertEquals(403, request("/frame", token = "wrong").first)
            assertEquals(200, request("/control", "POST", token, mapOf("X-Control" to "{\"action\":\"home\"}")).first)
            assertEquals(1, controls)
            assertEquals(429, request("/control", "POST", token, mapOf("X-Control" to "{}")).first)
            assertEquals(200, request("/stop", "POST", token).first)
            assertTrue(stopped); assertTrue(server.expired())
            assertEquals(403, request("/frame", token = token).first)
        } finally { server.stop() }
    }
    @Test fun refusesForeignOriginAndUntrustedPeer() {
        val server = server()
        try {
            assertEquals(403, request("/join", "POST", headers = mapOf("Origin" to "https://evil.example", "X-Pairing-Code" to server.pairingCode)).first)
            assertEquals(0, requests)
        } finally { server.stop() }
        val denied = server(false)
        try { assertEquals(403, request("/").first) } finally { denied.stop() }
        assertTrue(PhoneDirectServer.isTailnet("100.64.0.1"))
        assertTrue(PhoneDirectServer.isTailnet("100.127.255.254"))
        for (address in listOf("127.0.0.1", "192.168.1.1", "100.63.1.1", "100.128.0.1", "100.80.256.1", "host.example")) assertFalse(PhoneDirectServer.isTailnet(address))
    }
    @Test fun unapprovedPairingExpiresButApprovedSessionHasNoTimeLimit() {
        val server = server()
        try { time += 600001; assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to server.pairingCode)).first) }
        finally { server.stop() }
        val active = server()
        try {
            val token = join(active); active.approve()
            time += 24 * 60 * 60 * 1000L
            assertFalse(active.expired()); assertFalse(active.isStreaming())
            assertEquals(409, request("/control", "POST", token, mapOf("X-Control" to "{}")).first)
            assertEquals(200, request("/status", token = token).first)
            assertTrue(active.isStreaming()); assertEquals(1, requests)
            assertEquals(200, request("/stop", "POST", token).first)
            assertTrue(active.expired())
            assertEquals(403, request("/status", token = token).first)
        }
        finally { active.stop() }
    }
    @Test fun wrongCodeAttemptsAreBounded() {
        val server = server()
        try {
            repeat(20) { assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to "wrong")).first) }
            assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to server.pairingCode)).first)
        } finally { server.stop() }
    }
    @Test fun briefInterruptionResumesWithoutNewPairingButWithholdsFramesAndControls() {
        val server = server()
        try {
            val token = join(server); server.approve()
            server.frame = "old-frame".toByteArray()
            time += 16000
            assertFalse(server.isStreaming()); assertFalse(server.expired())
            assertEquals(409, request("/control", "POST", token, mapOf("X-Control" to "{}")).first)
            assertEquals(0, controls)
            assertTrue(JSONObject(request("/status", token = token).second).getBoolean("approved"))
            assertTrue(server.isStreaming()); assertNull(server.frame)
            assertEquals(1, requests)
            server.frame = "new-frame".toByteArray()
            assertEquals("new-frame", request("/frame", token = token).second)
            assertEquals(200, request("/pause", "POST", token).first)
            assertFalse(server.isStreaming()); assertNull(server.frame)
            time += 60000
            assertEquals(200, request("/status", token = token).first)
            assertTrue(server.isStreaming()); assertEquals(1, requests)
            request("/pause", "POST", token)
            time += 24 * 60 * 60 * 1000L
            assertFalse(server.expired()); assertFalse(server.isStreaming())
            assertEquals(200, request("/status", token = token).first)
            assertTrue(server.isStreaming()); assertEquals(1, requests)
        } finally { server.stop() }
    }
    @Test fun resumingPendingApprovalNeverApprovesTheViewer() {
        val server = server()
        try {
            val token = join(server)
            request("/pause", "POST", token); time += 30000
            assertFalse(JSONObject(request("/status", token = token).second).getBoolean("approved"))
            assertFalse(server.isStreaming())
            assertEquals(409, request("/frame", token = token).first)
            request("/stop", "POST", token)
            assertEquals(403, request("/status", token = token).first)
        } finally { server.stop() }
    }
    @Test fun pendingRequestCannotExtendItsApprovalWindow() {
        val server = server()
        try {
            val token = join(server)
            time += 600001
            server.approve()
            assertFalse(server.hasApproval())
            assertEquals(403, request("/status", token = token).first)
        } finally { server.stop() }
    }
    @Test fun explicitQuickQrConsentAllowsExactlyOneViewer() {
        val server = server()
        try {
            val quick = server.enableQuickPairing()
            assertNotEquals(server.pairingCode, quick)
            val result = request("/join", "POST", headers = mapOf("X-Pairing-Code" to quick))
            assertEquals(200, result.first)
            val token = JSONObject(result.second).getString("token")
            assertTrue(JSONObject(request("/status", token = token).second).getBoolean("approved"))
            assertEquals(1, requests)
            assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to quick)).first)
            assertEquals(200, request("/stop", "POST", token).first)
            assertTrue(server.expired())
        } finally { server.stop() }
    }
    @Test fun hiddenExpiredAndReplacedQrCannotGrantAccess() {
        val server = server()
        try {
            val hidden = server.enableQuickPairing(); server.disableQuickPairing()
            assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to hidden)).first)
            val old = server.enableQuickPairing(); val fresh = server.enableQuickPairing()
            assertNotEquals(old, fresh)
            assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to old)).first)
            time += 120001
            assertEquals(403, request("/join", "POST", headers = mapOf("X-Pairing-Code" to fresh)).first)
            val token = join(server)
            assertFalse(JSONObject(request("/status", token = token).second).getBoolean("approved"))
        } finally { server.stop() }
    }
    @Test fun droppedJoinResponseCanBeRecoveredOnlyByIdenticalAttempt() {
        val server = server()
        try {
            val quick = server.enableQuickPairing()
            val headers = mapOf("X-Pairing-Code" to quick, "X-Pairing-Request" to "a".repeat(32))
            val first = request("/join", "POST", headers = headers)
            val retry = request("/join", "POST", headers = headers)
            assertEquals(200, first.first); assertEquals(first, retry); assertEquals(1, requests)
            assertEquals(403, request("/join", "POST", headers = headers + ("X-Pairing-Request" to "b".repeat(32))).first)
            assertEquals(403, request("/join", "POST", headers = headers + ("X-Pairing-Code" to server.pairingCode)).first)
            val token = JSONObject(first.second).getString("token")
            request("/stop", "POST", token)
            assertEquals(403, request("/join", "POST", headers = headers).first)
        } finally { server.stop() }
    }
}
