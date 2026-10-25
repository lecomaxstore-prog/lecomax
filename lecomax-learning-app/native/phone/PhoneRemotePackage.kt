package com.lecomax.learning

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionConfig
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.provider.Settings
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import java.net.URI

class PhoneRemotePackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(PhoneRemoteModule(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class PhoneRemoteModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private var pending: Promise? = null
    private var relay = ""
    private var key = ""
    private var viewOnly = false
    private var internetId = ""
    private var invitation: PhoneInvitationServer? = null
    private val timer = android.os.Handler(android.os.Looper.getMainLooper())
    override fun getName() = "PhoneRemote"
    init {
        context.addActivityEventListener(object : BaseActivityEventListener() {
            override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
                if (requestCode != 7314) return
                val promise = pending ?: return
                pending = null
                if (resultCode != Activity.RESULT_OK || data == null) {
                    key = ""; promise.reject("CANCELLED", "Screen sharing was not approved."); return
                }
                try {
                    val intent = Intent(context, PhoneRemoteService::class.java)
                        .putExtra("capture", data).putExtra("result", resultCode)
                        .putExtra("relay", relay).putExtra("key", key).putExtra("direct", relay == "tailscale")
                        .putExtra("viewOnly", viewOnly)
                        .putExtra("internetId", internetId)
                    context.startForegroundService(intent)
                    promise.resolve(null)
                } catch (e: Exception) { promise.reject("START_FAILED", "Unable to start screen sharing.") }
                finally { key = "" }
            }
        })
    }
    @ReactMethod fun start(url: String, accessKey: String, promise: Promise) {
        startCapture(url, accessKey, false, promise)
    }
    @ReactMethod fun startViewOnly(promise: Promise) { startCapture("tailscale", "", true, promise) }
    @ReactMethod fun startInternetShare(id: String, token: String, promise: Promise) {
        if (!Regex("[a-f0-9]{32}").matches(id) || !Regex("[a-f0-9]{64}").matches(token)) {
            promise.reject("INVALID_INVITATION", "Open a valid sharing invitation."); return
        }
        startCapture("wss://phone.lecomax.com/internet-phone", token, true, promise, id)
    }
    private fun startCapture(url: String, accessKey: String, onlyView: Boolean, promise: Promise, inviteId: String = "") {
        val activity = context.currentActivity
        if (activity == null || pending != null || PhoneRemoteService.running) { promise.reject("BUSY", "Return to the app and stop any existing session first."); return }
        try {
            if (url == "tailscale") {
                if (PhoneDirectServer.tailscaleAddress() == null) { promise.reject("TAILSCALE_OFF", "Connect Tailscale on this phone, then try again."); return }
            } else {
            val uri = URI(url)
            require(uri.scheme == "wss" && !uri.host.isNullOrBlank() && uri.userInfo == null && uri.rawQuery == null && uri.fragment == null &&
                (uri.path == "/phone" || (onlyView && inviteId.isNotEmpty() && url == "wss://phone.lecomax.com/internet-phone")))
            require(Regex("[a-fA-F0-9]{64}").matches(accessKey))
            }
            if (!onlyView && PhoneRemoteInput.instance == null) { promise.reject("INPUT_DISABLED", "Enable ACADEMY remote touch in Accessibility first."); return }
            relay = url; key = accessKey; viewOnly = onlyView; internetId = inviteId; pending = promise
            val manager = context.getSystemService(MediaProjectionManager::class.java)
            val intent = if (Build.VERSION.SDK_INT >= 34) manager.createScreenCaptureIntent(MediaProjectionConfig.createConfigForDefaultDisplay()) else manager.createScreenCaptureIntent()
            activity.startActivityForResult(intent, 7314)
        } catch (e: Exception) { pending = null; key = ""; promise.reject("START_FAILED", "Check the secure relay address and access key.") }
    }
    @ReactMethod fun status(promise: Promise) {
        promise.resolve(Arguments.createMap().apply {
            putString("directUrl", PhoneRemoteService.directUrl)
            putBoolean("directSupported", true)
            putBoolean("invitationSupported", true)
            putBoolean("viewOnly", PhoneRemoteService.viewOnly)
            putBoolean("rememberedPhone", PhonePairingStore(context).read().isNotEmpty())
            putString("tailscaleIp", PhoneDirectServer.tailscaleAddress() ?: "")
            putString("state", PhoneRemoteService.state)
            putString("code", PhoneRemoteService.code)
            putBoolean("inputEnabled", PhoneRemoteInput.instance != null)
        })
    }
    @ReactMethod fun createInvitation(promise: Promise) {
        try {
            check(!PhoneRemoteService.running && pending == null)
            val address = PhoneDirectServer.tailscaleAddress() ?: throw IllegalStateException()
            invitation?.cancel()
            val next = PhoneInvitationServer(address)
            next.start(5000, true); invitation = next
            timer.postDelayed({ if (invitation === next) { next.cancel(); invitation = null } }, 600000)
            promise.resolve("http://$address:8093|${next.token}")
        } catch (_: Exception) { promise.reject("INVITATION_FAILED", "Connect Tailscale and stop sharing before creating an invitation.") }
    }
    @ReactMethod fun invitationStatus(promise: Promise) {
        promise.resolve(Arguments.createMap().apply {
            putBoolean("expired", invitation?.expired() != false)
            putString("pair", invitation?.result() ?: "")
        })
    }
    @ReactMethod fun cancelInvitation() { invitation?.cancel(); invitation = null }
    @ReactMethod fun finishInvitation() {
        val current = invitation ?: return
        timer.postDelayed({ if (invitation === current) { current.cancel(); invitation = null } }, 30000)
    }
    override fun invalidate() { cancelInvitation(); timer.removeCallbacksAndMessages(null); super.invalidate() }
    @ReactMethod fun approve() { PhoneRemoteService.instance?.approve() }
    @ReactMethod fun allowQrConnection(promise: Promise) {
        try { promise.resolve(PhoneRemoteService.instance?.quickPairCode() ?: throw IllegalStateException("Start sharing first.")) }
        catch (_: Exception) { promise.reject("QR_UNAVAILABLE", "Start a new sharing session before allowing a QR connection.") }
    }
    @ReactMethod fun cancelQrConnection() { PhoneRemoteService.instance?.cancelQuickPairing() }
    @ReactMethod fun stop() {
        PhonePairingStore(context).save("")
        PhoneRemoteService.instance?.disconnect()
        pending?.reject("CANCELLED", "Screen sharing was cancelled."); pending = null; key = ""
        context.stopService(Intent(context, PhoneRemoteService::class.java))
    }
    @ReactMethod fun openInputSettings() {
        context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}
