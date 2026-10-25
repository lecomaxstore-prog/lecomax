package com.lecomax.learning

import android.app.Instrumentation
import android.app.Activity
import android.content.*
import android.os.*
import org.json.JSONObject
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/** Fixed, harmless on-device checks. Packaged only in the separate test APK. */
class PhonePythonDeviceCheck : Instrumentation() {
    override fun onCreate(arguments: Bundle?) { super.onCreate(arguments); start() }
    override fun onStart() {
        val report = Bundle()
        try {
            val output = runPython("import sys, json\nname = input('Name: ')\nprint(json.dumps({'total': sum([80, 10, 25]), 'name': name, 'platform': sys.platform}))", "Ziko\n")
            check(output.getInt("exitCode") == 0) { output.toString() }
            check(output.getString("stdout").contains("115")) { output.toString() }
            check(output.getString("stdout").contains("Ziko")) { output.toString() }
            Thread.sleep(700)
            val failure = runPython("print(1 / 0)", "")
            check(failure.getString("stderr").contains("ZeroDivisionError")) { failure.toString() }
            report.putString("stream", "PASS: Real CPython on Android calculated 115, accepted input Ziko, and returned ZeroDivisionError. Python " + output.optString("version"))
            finish(Activity.RESULT_OK, report)
        } catch (error: Throwable) {
            report.putString("stream", "FAIL: " + error.toString())
            finish(Activity.RESULT_CANCELED, report)
        }
    }
    private fun runPython(code: String, input: String): JSONObject {
        val done = CountDownLatch(1)
        val thread = HandlerThread("PythonDeviceCheck").apply { start() }
        var result: String? = null
        var remote: Messenger? = null
        val reply = Messenger(object : Handler(thread.looper) {
            override fun handleMessage(message: Message) {
                result = message.data.getString("result") ?: message.data.getString("error")
                done.countDown()
            }
        })
        val connection = object : ServiceConnection {
            override fun onServiceConnected(name: ComponentName, service: IBinder) {
                remote = Messenger(service)
                remote!!.send(Message.obtain(null, 1).apply {
                    replyTo = reply
                    data = Bundle().apply { putString("code", code); putString("input", input) }
                })
            }
            override fun onServiceDisconnected(name: ComponentName) { done.countDown() }
        }
        val intent = Intent().setClassName(targetContext.packageName, "com.lecomax.learning.PhonePythonService")
        check(targetContext.bindService(intent, connection, Context.BIND_AUTO_CREATE))
        try {
            check(done.await(20, TimeUnit.SECONDS)) { "Python service timed out" }
            return JSONObject(result ?: error("No Python result"))
        } finally {
            try { remote?.send(Message.obtain(null, 2)) } catch (_: Exception) {}
            targetContext.unbindService(connection)
            thread.quitSafely()
        }
    }
}
