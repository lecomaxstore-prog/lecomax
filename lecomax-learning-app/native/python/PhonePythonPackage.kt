package com.lecomax.learning

import android.content.*
import android.os.*
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager

class PhonePythonPackage : ReactPackage {
    override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(PhonePythonModule(context))
    override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

class PhonePythonModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val handler = Handler(Looper.getMainLooper())
    private var pending: Promise? = null
    private var connection: ServiceConnection? = null
    private var remote: Messenger? = null
    private var started = 0L
    override fun getName() = "PhonePython"
    private val timeout = Runnable { finishStopped(true) }

    private fun release() {
        handler.removeCallbacks(timeout)
        try { remote?.send(Message.obtain(null, 2)) } catch (_: Exception) {}
        connection?.let { try { context.unbindService(it) } catch (_: Exception) {} }
        connection = null
        remote = null
        pending = null
    }
    private fun finishStopped(timedOut: Boolean) {
        val promise = pending ?: return
        val result = Arguments.createMap().apply {
            putString("stdout", "")
            putString("stderr", if (timedOut) "Execution stopped after 10 seconds." else "Execution stopped.")
            putNull("exitCode")
            putDouble("durationMs", (System.currentTimeMillis() - started).toDouble())
            putBoolean("timedOut", timedOut)
            putBoolean("cancelled", !timedOut)
            putBoolean("truncated", false)
        }
        release()
        promise.resolve(result)
    }
    @ReactMethod fun stop() { handler.post { finishStopped(false) } }
    @ReactMethod fun run(code: String, input: String, promise: Promise) {
        handler.post {
            if (pending != null) { promise.reject("PYTHON_BUSY", "Python is already running"); return@post }
            if (code.length > 12000 || input.length > 12000) { promise.reject("INPUT_TOO_LARGE", "Input is too large"); return@post }
            pending = promise
            started = System.currentTimeMillis()
            val reply = Messenger(object : Handler(Looper.getMainLooper()) {
                override fun handleMessage(message: Message) {
                    if (pending !== promise) return
                    val result = message.data.getString("result")
                    val error = message.data.getString("error")
                    release()
                    if (result != null) promise.resolve(result) else promise.reject("PYTHON_ERROR", error ?: "Python failed")
                }
            })
            val binding = object : ServiceConnection {
                override fun onServiceConnected(name: ComponentName, binder: IBinder) {
                    if (pending !== promise) return
                    remote = Messenger(binder)
                    try {
                        remote!!.send(Message.obtain(null, 1).apply {
                            replyTo = reply
                            data = Bundle().apply { putString("code", code); putString("input", input) }
                        })
                    } catch (error: Exception) { release(); promise.reject("PYTHON_ERROR", error) }
                }
                override fun onServiceDisconnected(name: ComponentName) {
                    if (pending === promise) { release(); promise.reject("PYTHON_EXITED", "Python process exited. Run again to restart.") }
                }
            }
            connection = binding
            try {
                if (!context.bindService(Intent(context, PhonePythonService::class.java), binding, Context.BIND_AUTO_CREATE)) {
                    release(); promise.reject("PYTHON_ERROR", "Cannot start Python"); return@post
                }
                handler.postDelayed(timeout, 10000)
            } catch (error: Exception) { release(); promise.reject("PYTHON_ERROR", error) }
        }
    }
    override fun invalidate() { handler.post { finishStopped(false) }; super.invalidate() }
}
