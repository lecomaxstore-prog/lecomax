// Fixed local executable/port profiles only. Never accept DSNs, hosts or env targets.
function localPostgresProfile(args) {
  if (args.length > 1 || args.length === 1 && !['--pg17','--pg17-rest'].includes(args[0])) throw Error('NO_TARGET_OVERRIDES');
  if (args[0] === '--pg17-rest') return {
    bin: require('node:path').resolve(__dirname, '../artifacts/seo-local-tools/pgsql/bin'),
    host: '127.0.0.1', port: 55460, versionPattern: /^17\.11(?:\D|$)/,
    expectedVersion: '17.11', postgrest: true,
  };
  const pg17 = args[0] === '--pg17';
  return {
    bin: `C:/Program Files/PostgreSQL/${pg17 ? '17' : '18'}/bin`,
    host: '127.0.0.1', port: pg17 ? 55460 : 55459,
    versionPattern: pg17 ? /^17\./ : /^18\.6(?:\D|$)/,
    expectedVersion: pg17 ? '17.x' : '18.6',
  };
}
module.exports = {localPostgresProfile};
