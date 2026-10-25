const upstream = require('@expo/metro-config/babel-transformer');
module.exports.transform = args => {
  if (args.filename.replaceAll('\\', '/').endsWith('/@novnc/novnc/core/util/browser.js')) {
    // Metro wraps modules in synchronous factories. noVNC's optional H.264
    // probe must not introduce top-level await into those factories. Start
    // conservatively without H.264; advertise it only after detection succeeds.
    const original = 'supportsWebCodecsH264Decode = await _checkWebCodecsH264DecodeSupport();';
    if (!args.src.includes(original)) throw new Error('Review noVNC Metro compatibility after upgrading noVNC.');
    args = { ...args, src: args.src.replace(original, 'void _checkWebCodecsH264DecodeSupport().then(supported => { supportsWebCodecsH264Decode = supported; }).catch(() => {});') };
  }
  return upstream.transform(args);
};
