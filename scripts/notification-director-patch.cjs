// Patch the verified deployed callable source, without altering AI or notification payloads.
// Preparing files is local-only; deployment is a separate, explicitly selected command.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const JSZip = require('jszip');

function patchDirectorNotifications(source) {
  const replacements = [
    [".where('role', '==', 'admin')", ".where('role', 'in', ['admin', 'director'])"],
    ["if (callerSnap.data()?.role !== 'admin') {", "if (!['admin', 'director'].includes(callerSnap.data()?.role)) {"],
    ["'Chỉ admin mới gửi thông báo cho người khác.'", "'Không có quyền gửi thông báo cho người khác.'"],
  ];
  for (const [before, after] of replacements) {
    const count = source.split(before).length - 1;
    if (count === 1) source = source.replace(before, after);
    else if (count !== 0 || !source.includes(after)) throw new Error('Unexpected function source; review before patching');
  }
  return source;
}
async function prepare(archivePath, outputFolder) {
  const archive = fs.readFileSync(archivePath), zip = await JSZip.loadAsync(archive);
  const targets = ['src/index.ts', 'lib/index.js', 'package.json', 'package-lock.json', 'tsconfig.json'];
  if (targets.some(name => !zip.file(name))) throw new Error('Expected source files missing');
  const output = path.resolve(outputFolder);
  if (fs.existsSync(output)) throw new Error('Output already exists; preserve prior release');
  const content = await Promise.all(targets.map(async name => [name, await zip.file(name).async('string')]));
  const manifest = { archiveSha256: crypto.createHash('sha256').update(archive).digest('hex'), runtime: 'nodejs22', targets: ['notifyAdmins', 'createNotification'], sourceHashes: {} };
  for (const [name, original] of content) {
    let patched = /index\.(ts|js)$/.test(name) ? patchDirectorNotifications(original) : original;
    if (name === 'package.json' || name === 'package-lock.json') {
      const json = JSON.parse(original);
      const target = name === 'package.json' ? json : json.packages[''];
      target.engines = { ...target.engines, node: '22' };
      patched = JSON.stringify(json, null, 2) + '\n';
    }
    const file = path.join(output, name);
    fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, patched, { flag: 'wx' });
    manifest.sourceHashes[name] = { before: crypto.createHash('sha256').update(original).digest('hex'), after: crypto.createHash('sha256').update(patched).digest('hex') };
  }
  fs.writeFileSync(path.join(output, 'patch-manifest.json'), JSON.stringify(manifest, null, 2), { flag: 'wx' });
  console.log('Prepared local source patch for notifyAdmins/createNotification. No Firebase writes or deployment.');
}
if (require.main === module) {
  if (process.argv.length !== 4) { console.error('Usage: node scripts/notification-director-patch.cjs ARCHIVE.zip NEW_OUTPUT_FOLDER'); process.exitCode = 1; }
  else prepare(process.argv[2], process.argv[3]).catch(e => { console.error(e.message?.startsWith('Unexpected') || e.message?.startsWith('Output') || e.message?.startsWith('Expected') ? e.message : 'Unable to prepare source patch'); process.exitCode = 1; });
}
module.exports = { patchDirectorNotifications };
