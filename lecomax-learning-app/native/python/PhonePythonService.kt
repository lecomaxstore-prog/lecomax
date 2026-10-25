package com.lecomax.learning

import android.app.Service
import android.content.Intent
import android.os.*
import com.chaquo.python.Python
import com.chaquo.python.android.AndroidPlatform
import java.io.File

// A separate process allows Stop and timeout to terminate even blocking native calls.
class PhonePythonService : Service() {
    private var running = false
    private val messenger = Messenger(object : Handler(Looper.getMainLooper()) {
        override fun handleMessage(message: Message) {
            if (message.what == 2) { Process.killProcess(Process.myPid()); return }
            if (message.what != 1 || running) return
            running = true
            val reply = message.replyTo
            val code = message.data.getString("code") ?: ""
            val input = message.data.getString("input") ?: ""
            Thread {
                val result = Bundle()
                try {
                    if (!Python.isStarted()) Python.start(AndroidPlatform(this@PhonePythonService))
                    val workspace = File(filesDir, "python-workspace").apply { mkdirs() }
                    Python.getInstance().getModule("os").callAttr("chdir", workspace.absolutePath)
                    result.putString("result", Python.getInstance().getModule("phone_runner")
                        .callAttr("run", code, input).toString())
                } catch (error: Throwable) {
                    result.putString("error", error.message ?: "Python failed to start")
                }
                try { reply.send(Message.obtain(null, 1).apply { data = result }) } catch (_: Exception) {}
            }.start()
        }
    })
    override fun onBind(intent: Intent): IBinder = messenger.binder
    override fun onUnbind(intent: Intent): Boolean {
        Process.killProcess(Process.myPid())
        return false
    }
}
