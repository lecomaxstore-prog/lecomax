const { withAppBuildGradle, withAndroidManifest, withMainApplication, withStringsXml, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
module.exports = config => {
  config = withAppBuildGradle(config, mod => {
    if (!mod.modResults.contents.includes('org.nanohttpd:nanohttpd:2.3.1')) mod.modResults.contents += '\ndependencies { implementation "org.nanohttpd:nanohttpd:2.3.1" }\n';
    if (!mod.modResults.contents.includes('org.json:json:20240303')) mod.modResults.contents += '\ndependencies { testImplementation "junit:junit:4.13.2"; testImplementation "org.json:json:20240303" }\n';
    return mod;
  });
  config = withAndroidManifest(config, mod => {
    const manifest = mod.modResults.manifest;
    manifest['uses-permission'] ||= [];
    for (const name of ['android.permission.FOREGROUND_SERVICE', 'android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION']) {
      if (!manifest['uses-permission'].some(p => p.$['android:name'] === name)) manifest['uses-permission'].push({ $: { 'android:name': name } });
    }
    const app = manifest.application[0];
    app.service ||= [];
    if (!app.service.some(s => s.$['android:name'] === '.PhoneRemoteService')) app.service.push({ $: { 'android:name': '.PhoneRemoteService', 'android:exported': 'false', 'android:foregroundServiceType': 'mediaProjection' } });
    app.service.find(s => s.$['android:name'] === '.PhoneRemoteService').$['android:stopWithTask'] = 'false';
    if (!app.service.some(s => s.$['android:name'] === '.PhoneRemoteInput')) app.service.push({
      $: { 'android:name': '.PhoneRemoteInput', 'android:exported': 'true', 'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE', 'android:label': 'ACADEMY remote touch' },
      'intent-filter': [{ action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }] }],
      'meta-data': [{ $: { 'android:name': 'android.accessibilityservice', 'android:resource': '@xml/phone_remote_accessibility' } }],
    });
    return mod;
  });
  config = withStringsXml(config, mod => {
    const strings = mod.modResults.resources.string ||= [];
    const name = 'phone_remote_input_description';
    if (!strings.some(s => s.$.name === name)) strings.push({ $: { name }, _: 'Allows a paired phone to tap, swipe, and use Back, Home and Recents only during a screen-sharing session you approve in ACADEMY. Stop sharing in the app or notification at any time. No screen text is read by this accessibility service.' });
    return mod;
  });
  config = withMainApplication(config, mod => {
    if (!mod.modResults.contents.includes('add(PhoneRemotePackage())')) mod.modResults.contents = mod.modResults.contents.replace('PackageList(this).packages.apply {', 'PackageList(this).packages.apply {\n          add(PhoneRemotePackage())');
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const main = path.join(mod.modRequest.platformProjectRoot, 'app/src/main');
    for (const file of ['PhoneInvitationServer.kt', 'PhonePairingStore.kt', 'PhoneDirectServer.kt', 'PhoneRemotePackage.kt', 'PhoneRemoteInput.kt', 'PhoneRemoteService.kt', 'phone_remote_accessibility.xml']) {
      const dir = path.join(main, file.endsWith('.kt') ? 'java/com/lecomax/learning' : 'res/xml');
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(path.join(mod.modRequest.projectRoot, 'native/phone', file), path.join(dir, file));
    }
    const assets = path.join(main, 'assets/phone-remote');
    fs.mkdirSync(assets, { recursive: true });
    for (const file of ['direct.html', 'direct.js', 'viewer.css']) fs.copyFileSync(path.join(mod.modRequest.projectRoot, 'phone-relay', file), path.join(assets, file));
    const tests = path.join(mod.modRequest.platformProjectRoot, 'app/src/test/java/com/lecomax/learning');
    fs.mkdirSync(tests, { recursive: true });
    fs.copyFileSync(path.join(mod.modRequest.projectRoot, 'native/phone/PhoneDirectServerTest.kt'), path.join(tests, 'PhoneDirectServerTest.kt'));
    return mod;
  }]);
};
