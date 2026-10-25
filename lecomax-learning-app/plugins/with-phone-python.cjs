const { withProjectBuildGradle, withAppBuildGradle, withMainApplication, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
module.exports = config => {
  config = withProjectBuildGradle(config, mod => {
    if (!mod.modResults.contents.includes('com.chaquo.python:gradle')) mod.modResults.contents = mod.modResults.contents.replace('dependencies {', "dependencies {\n    classpath('com.chaquo.python:gradle:17.0.0')");
    return mod;
  });
  config = withAppBuildGradle(config, mod => {
    if (!mod.modResults.contents.includes('com.chaquo.python')) {
      mod.modResults.contents += `\napply plugin: 'com.chaquo.python'\nchaquopy { defaultConfig {\n    version = '3.14'\n    if (System.getenv('LECOMAX_PYTHON_EXECUTABLE')) buildPython(System.getenv('LECOMAX_PYTHON_EXECUTABLE'))\n} }\n`;
      mod.modResults.contents = mod.modResults.contents.replace('defaultConfig {', 'defaultConfig {\n        testInstrumentationRunner "com.lecomax.learning.PhonePythonDeviceCheck"\n        ndk { abiFilters "arm64-v8a", "x86_64" }');
      mod.modResults.contents += '\nandroid { testBuildType "release" }\n';
    }
    return mod;
  });
  config = withMainApplication(config, mod => {
    if (!mod.modResults.contents.includes('add(PhonePythonPackage())')) mod.modResults.contents = mod.modResults.contents.replace('PackageList(this).packages.apply {', 'PackageList(this).packages.apply {\n          add(PhonePythonPackage())');
    // The Python worker needs no React host or Expo initialization.
    if (!mod.modResults.contents.includes('endsWith(":python")')) mod.modResults.contents = mod.modResults.contents.replace('super.onCreate()', 'super.onCreate()\n    if ((getSystemService(ACTIVITY_SERVICE) as android.app.ActivityManager).runningAppProcesses?.any { it.pid == android.os.Process.myPid() && it.processName.endsWith(":python") } == true) return');
    return mod;
  });
  config = withAndroidManifest(config, mod => {
    const app = mod.modResults.manifest.application[0];
    app.service ||= [];
    if (!app.service.some(s => s.$['android:name'] === '.PhonePythonService')) app.service.push({ $: { 'android:name': '.PhonePythonService', 'android:process': ':python', 'android:exported': 'false', 'android:stopWithTask': 'true' } });
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const source = path.join(mod.modRequest.projectRoot, 'native/python');
    const main = path.join(mod.modRequest.platformProjectRoot, 'app/src/main');
    for (const name of ['PhonePythonService.kt', 'PhonePythonPackage.kt', 'phone_runner.py']) {
      const target = path.join(main, name.endsWith('.kt') ? 'java/com/lecomax/learning' : 'python', name);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(source, name), target);
    }
    const testDir = path.join(mod.modRequest.platformProjectRoot, 'app/src/androidTest/java/com/lecomax/learning');
    fs.mkdirSync(testDir, { recursive: true });
    fs.copyFileSync(path.join(source, 'PhonePythonDeviceCheck.kt'), path.join(testDir, 'PhonePythonDeviceCheck.kt'));
    return mod;
  }]);
};
