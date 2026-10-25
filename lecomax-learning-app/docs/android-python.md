# Android Python

Version 1.0.6 introduces CPython 3.14 inside the APK through Chaquopy 17.
Android's Python and console entries open `PhonePythonLab`; web keeps the PC terminal.
No local server, USB cable, or internet is required for Python after installation.
AI Teacher uses the configured HTTPS learning API and still requires sign-in and internet.

The editor runs a complete script in a fresh Python service process. Enter answers for
`input()` in advance, one per line. Standard-library imports, Unicode and Python
tracebacks are real. This is not a desktop shell, package manager, or persistent REPL.
Third-party Python packages are not bundled in this release.
Relative files are stored in the app's private `python-workspace` directory and survive runs.

The service is not exported. Stop and the ten-second deadline terminate its process,
including blocking calls, without intentionally terminating the app. Output is capped
at 24,000 characters per stream. Interrupted runs may have no captured output.
Python shares the application's Android permissions; this is not a security sandbox.

`plugins/with-phone-python.cjs` preserves native integration across Expo prebuilds.
Source Kotlin and Python files live in `native/python/`; generated `android/` files
must not be the only copy of changes.

Build with Java 21, the Android SDK, and Python 3.14 on the build machine. Set
`LECOMAX_PYTHON_EXECUTABLE` to the real Python executable and
`EXPO_PUBLIC_LEARNING_API_URL=https://lecomax.com` for the phone release.
Run Expo prebuild from the learning app directory, then Gradle `:app:assembleRelease`
with `-PreactNativeArchitectures=arm64-v8a`. Existing local release signing credentials
are required to update the installed app without uninstalling it.

`PhonePythonDeviceCheck.kt` is packaged only in a separate instrumentation APK.
Build `:app:assembleReleaseAndroidTest`; it checks real device calculation, input and
tracebacks through the Python service. The Python unit tests run with
`python -m unittest discover -s native/python -p test_phone_runner.py`.
