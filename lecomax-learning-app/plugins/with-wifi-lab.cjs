const { withAndroidManifest } = require('expo/config-plugins');
// The native WebView only accepts a user-selected private IPv4 origin on port
// 8081. Production owner API requests still require HTTPS in services/auth.ts.
module.exports = config => withAndroidManifest(config, result => {
  result.modResults.manifest.application[0].$['android:usesCleartextTraffic'] = 'true';
  return result;
});
