const { withAppBuildGradle } = require('expo/config-plugins');
module.exports = config => withAppBuildGradle(config, mod => {
  let text = mod.modResults.contents;
  if (!text.includes('def credentialsFile =')) {
    text = text.replace('signingConfigs {', `signingConfigs {
        // LECOMAX_RELEASE_SIGNING: read locally at build time, never serialize into Expo config.
        release {
            def credentialsFile = new File(projectRoot, 'credentials.json')
            if (credentialsFile.exists()) {
                def signing = new groovy.json.JsonSlurper().parse(credentialsFile).android.keystore
                storeFile new File(projectRoot, signing.keystorePath)
                storePassword signing.keystorePassword
                keyAlias signing.keyAlias
                keyPassword signing.keyPassword
            }
        }`);
  }
  const buildTypes = text.indexOf('buildTypes {');
  const release = text.indexOf('release {', buildTypes);
  if (buildTypes < 0 || release < 0) throw new Error('Cannot locate Android release signing configuration');
  text = text.slice(0, release) + text.slice(release).replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release');
  mod.modResults.contents = text;
  return mod;
});
