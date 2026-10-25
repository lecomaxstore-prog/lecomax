package com.lecomax.learning

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.*
import android.view.WindowManager
import okhttp3.*
import okio.ByteString.Companion.toByteString
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.util.concurrent.TimeUnit

class PhoneRemoteService : Service() {
    companion object {
        @Volatile var instance: PhoneRemoteService? = null
        @Volatile var running = false
        @Volatile var controlling = false
        @Volatile var state = "idle"
        @Volatile var code = ""
        @Volatile var directUrl = ""
        @Volatile var viewOnly = false
    }
    private val main = Handler(Looper.getMainLooper())
    private var worker: HandlerThread? = null
    @Volatile private var reader: ImageReader? = null
    private var display: VirtualDisplay? = null
    private var projection: MediaProjection? = null
    private var socket: WebSocket? = null
    private var direct: PhoneDirectServer? = null
    private var client: OkHttpClient? = null
    private var lastFrame = 0L
    private var captureWidth = 0
    private var captureHeight = 0
    private var closed = false
    override fun onBind(intent: Intent?) = null
    private fun notification(text: String): Notification {
        val stop = PendingIntent.getService(this, 1, Intent(this, PhoneRemoteService::class.java).setAction("STOP"), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val open = PendingIntent.getActivity(this, 2, packageManager.getLaunchIntentForPackage(packageName), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        return Notification.Builder(this, "phone-remote").setSmallIcon(android.R.drawable.ic_menu_view)
            .setContentTitle("ACADEMY · Phone sharing").setContentText(text).setOngoing(true)
            .setContentIntent(open).addAction(Notification.Action.Builder(null, "Stop sharing", stop).build()).build()
    }
    private fun notifyState(text: String) { getSystemService(NotificationManager::class.java).notify(7314, notification(text)) }
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "STOP") { disconnect(); return START_NOT_STICKY }
        if (running || intent == null) return START_NOT_STICKY
        instance = this; running = true; state = "connecting"; code = ""; controlling = false
        viewOnly = intent.getBooleanExtra("viewOnly", false)
        try {
            getSystemService(NotificationManager::class.java).createNotificationChannel(NotificationChannel("phone-remote", "Phone screen sharing", NotificationManager.IMPORTANCE_LOW))
            if (Build.VERSION.SDK_INT >= 29) startForeground(7314, notification("Connecting · Stop sharing at any time"), ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
            else startForeground(7314, notification("Connecting · Stop sharing at any time"))
            @Suppress("DEPRECATION") val capture = intent.getParcelableExtra<Intent>("capture") ?: throw IllegalArgumentException()
            projection = getSystemService(MediaProjectionManager::class.java).getMediaProjection(intent.getIntExtra("result", Activity.RESULT_CANCELED), capture)
            projection!!.registerCallback(object : MediaProjection.Callback() {
                override fun onStop() { if (!closed) { state = "capture-stopped"; stopSelf() } }
                override fun onCapturedContentResize(width: Int, height: Int) {
                    resizeCapture(width, height)
                }
            }, main)
            val metrics = resources.displayMetrics
            val wm = getSystemService(WindowManager::class.java)
            val bounds = if (Build.VERSION.SDK_INT >= 30) wm.maximumWindowMetrics.bounds else android.graphics.Rect(0, 0, metrics.widthPixels, metrics.heightPixels)
            val scale = minOf(1.0, 960.0 / maxOf(bounds.width(), bounds.height()))
            captureWidth = (bounds.width() * scale).toInt().coerceAtLeast(2)
            captureHeight = (bounds.height() * scale).toInt().coerceAtLeast(2)
            worker = HandlerThread("PhoneRemoteFrames").apply { start() }
            replaceReader(captureWidth, captureHeight)
            display = projection!!.createVirtualDisplay("ACADEMY phone sharing", captureWidth, captureHeight, metrics.densityDpi, DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader!!.surface, null, main)
            if (intent.getBooleanExtra("direct", false)) {
                val address = PhoneDirectServer.tailscaleAddress() ?: throw IllegalStateException("Connect Tailscale first")
                direct = PhoneDirectServer(
                    { file -> assets.open("phone-remote/$file").bufferedReader().use { it.readText() } },
                    { getSystemService(KeyguardManager::class.java).isKeyguardLocked }, address,
                    { main.post { if (!closed) {
                        if (direct?.hasApproval() == true) {
                            controlling = true; code = ""; state = "sharing"
                            notifyState(if (viewOnly) "View-only connected - Stop at any time" else "QR connected - Stop sharing at any time")
                        } else { state = "approval"; notifyState("Connection request · Open ACADEMY to approve") }
                    } } },
                    { message -> main.post { if (!closed && controlling && !viewOnly) PhoneRemoteInput.instance?.control(message) } },
                    { main.post { stopSelf() } },
                    rememberedToken = if (viewOnly) "" else PhonePairingStore(this).read(),
                    remember = { token -> if (!viewOnly) PhonePairingStore(this).save(token) },
                    viewOnly = viewOnly)
                direct!!.start(5000, true)
                directUrl = "http://$address:8092"
                code = if (direct!!.hasApproval()) "" else direct!!.pairingCode; state = if (direct!!.hasApproval()) "paused" else "waiting"
                notifyState("Tailscale ready · Open ACADEMY for the address and code")
                main.post(object : Runnable {
                    override fun run() {
                        if (closed) return
                        if (direct?.expired() != false) { stopSelf(); return }
                        // A temporary VPN outage must not destroy the approved session.
                        // The listener remains bound only to its original Tailscale address.
                        val networkReady = PhoneDirectServer.tailscaleAddress() == address
                        direct?.let { server ->
                            if (server.hasApproval()) {
                                controlling = networkReady && server.isStreaming()
                                val next = if (!networkReady) "reconnecting" else if (controlling) "sharing" else "paused"
                                if (state != next) {
                                    state = next
                                    notifyState(if (!networkReady) "Waiting for Tailscale · Stop sharing at any time" else if (controlling) (if (viewOnly) "View-only sharing - Stop at any time" else "Your screen is being shared and controlled") else "Viewer paused · Session kept until you stop sharing")
                                }
                            }
                        }
                        main.postDelayed(this, 1000)
                    }
                })
            } else {
            client = OkHttpClient.Builder().pingInterval(20, TimeUnit.SECONDS).build()
            val authKey = intent.getStringExtra("key") ?: throw IllegalArgumentException()
            socket = client!!.newWebSocket(Request.Builder().url(intent.getStringExtra("relay")!!).build(), object : WebSocketListener() {
                override fun onOpen(ws: WebSocket, response: Response) {
                    val invitation = intent.getStringExtra("internetId") ?: ""
                    if (viewOnly && invitation.isNotEmpty()) {
                        main.post { if (!closed) { state = "approving"; ws.send(JSONObject().put("type", "publish").put("id", invitation).put("token", authKey).toString()) } }
                    } else ws.send(JSONObject().put("type", "host").put("key", authKey).toString())
                }
                override fun onMessage(ws: WebSocket, text: String) {
                    if (text.length > 4096) { main.post { fail() }; return }
                    try {
                        val m = JSONObject(text)
                        main.post {
                            if (closed) return@post
                            when (m.optString("type")) {
                                "created" -> { code = m.optString("code"); state = "waiting"; notifyState("Ready to pair · Open ACADEMY for the code") }
                                "request" -> { state = "approval"; notifyState("Connection request · Open ACADEMY to approve") }
                                "connected" -> { if (state == "approving") { controlling = true; code = ""; state = "sharing"; notifyState(if (viewOnly) "View-only sharing - Stop at any time" else "Your screen is being shared and controlled") } }
                                "control" -> if (controlling && !viewOnly) PhoneRemoteInput.instance?.control(m)
                                "ended" -> stopSelf()
                            }
                        }
                    } catch (_: Exception) { main.post { fail() } }
                }
                override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) { main.post { if (!closed) fail() } }
                override fun onClosed(ws: WebSocket, code: Int, reason: String) { main.post { if (!closed) stopSelf() } }
                override fun onClosing(ws: WebSocket, code: Int, reason: String) { ws.close(code, null); main.post { if (!closed) stopSelf() } }
            })
            }
            intent.removeExtra("key"); intent.removeExtra("capture")
            if (direct == null) main.postDelayed({ if (running) stopSelf() }, 4 * 60 * 60 * 1000L)
        } catch (_: Exception) { fail() }
        return START_NOT_STICKY
    }
    private fun replaceReader(width: Int, height: Int) {
        reader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2)
        reader!!.setOnImageAvailableListener({ source ->
            val image = try { source.acquireLatestImage() } catch (_: Exception) { null }
            if (image != null) try {
                val time = SystemClock.elapsedRealtime()
                if (source === reader && controlling && time - lastFrame >= 500 && (direct != null || (socket?.queueSize() ?: Long.MAX_VALUE) < 524288) && !getSystemService(KeyguardManager::class.java).isKeyguardLocked) {
                lastFrame = time
                val plane = image.planes[0]
                val paddedWidth = plane.rowStride / plane.pixelStride
                val bitmap = Bitmap.createBitmap(paddedWidth, image.height, Bitmap.Config.ARGB_8888)
                bitmap.copyPixelsFromBuffer(plane.buffer)
                val cropped = Bitmap.createBitmap(bitmap, 0, 0, image.width, image.height)
                val output = ByteArrayOutputStream()
                cropped.compress(Bitmap.CompressFormat.JPEG, 60, output)
                if (cropped !== bitmap) cropped.recycle()
                bitmap.recycle()
                val bytes = output.toByteArray()
                if (bytes.size < 524288 && controlling && source === reader) { if (direct != null) direct?.frame = bytes else socket?.send(bytes.toByteString()) }
                }
            } catch (_: Exception) { if (source === reader) main.post { if (source === reader && !closed) fail() } } finally { image.close() }
        }, Handler(worker!!.looper))
    }
    private fun resizeCapture(width: Int, height: Int) {
        if (closed || width <= 0 || height <= 0 || display == null) return
        val scale = minOf(1.0, 960.0 / maxOf(width, height))
        val nextWidth = (width * scale).toInt().coerceAtLeast(2)
        val nextHeight = (height * scale).toInt().coerceAtLeast(2)
        if (nextWidth == captureWidth && nextHeight == captureHeight) return
        try {
            val previous = reader
            previous?.setOnImageAvailableListener(null, null)
            direct?.frame = null
            captureWidth = nextWidth; captureHeight = nextHeight
            replaceReader(nextWidth, nextHeight)
            // Resize the existing display. Android consent tokens are single-use.
            display?.surface = null
            display?.resize(nextWidth, nextHeight, resources.configuration.densityDpi)
            display?.surface = reader!!.surface
            previous?.close()
        } catch (_: Exception) { fail() }
    }
    override fun onConfigurationChanged(config: android.content.res.Configuration) {
        super.onConfigurationChanged(config)
        if (Build.VERSION.SDK_INT < 34) {
            val wm = getSystemService(WindowManager::class.java)
            val metrics = android.util.DisplayMetrics()
            @Suppress("DEPRECATION") wm.defaultDisplay.getRealMetrics(metrics)
            resizeCapture(metrics.widthPixels, metrics.heightPixels)
        }
    }
    fun approve() { main.post { if (state == "approval") { if (direct != null) { try { direct!!.approve() } catch (_: Exception) { fail(); return@post }; controlling = true; code = ""; state = "sharing"; notifyState(if (viewOnly) "View-only sharing - Stop at any time" else "Your screen is being shared and controlled") } else { state = "approving"; socket?.send("{\"type\":\"approve\"}") } } } }
    fun quickPairCode(): String = direct?.enableQuickPairing() ?: throw IllegalStateException("Start Tailscale sharing first.")
    fun cancelQuickPairing() { direct?.disableQuickPairing() }
    fun disconnect() { direct?.invalidate(); PhonePairingStore(this).save(""); stopSelf() }
    private fun fail() { state = "error"; stopSelf() }
    override fun onDestroy() {
        closed = true; controlling = false; running = false; code = ""; instance = null
        if (state != "error" && state != "rotation-stopped" && state != "capture-stopped") state = "idle"
        main.removeCallbacksAndMessages(null)
        direct?.invalidate(false); direct?.stop(); direct = null; directUrl = ""
        socket?.close(1000, "Stopped"); socket = null
        reader?.setOnImageAvailableListener(null, null)
        display?.release(); projection?.stop(); reader?.close(); worker?.quitSafely()
        client?.dispatcher?.executorService?.shutdown()
        client?.connectionPool?.evictAll()
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }
}
