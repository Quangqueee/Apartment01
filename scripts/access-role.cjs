// Bootstrap/repair privileged roles by a trusted Firebase operator using ADC, with an audit transaction.
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const args = process.argv.slice(2);
function parseArgs(values) {
  const options = {};
  for (let i = 0; i < values.length; i++) {
    const key = values[i];
    if (key === '--apply') { options.apply = true; continue; }
    if (!['--project', '--uid', '--email', '--role', '--operator'].includes(key)
      || !values[i + 1] || values[i + 1].startsWith('--') || options[key.slice(2)]) {
      throw new Error('Tham số không hợp lệ. Dùng --project, --email (hoặc --uid), --role; --apply cần --operator.');
    }
    options[key.slice(2)] = values[++i];
  }
  if (!options.project || !options.role || (!!options.uid === !!options.email)) {
    throw new Error('Cần --project PROJECT_THAT --role director và đúng một trong --email / --uid.');
  }
  if ([options.project, options.uid, options.operator].some(v => v && /^(PROJECT_ID|UID_TAI_KHOAN|UID_NGUOI_QUAN_TRI)$/.test(v))) {
    throw new Error('Bạn đang dùng giá trị mẫu. Project của repository là quang-apartment; dùng --email để tra UID thật.');
  }
  if (!['user', 'collaborator', 'landlord', 'admin', 'director'].includes(options.role)
    || (options.uid && !/^[A-Za-z0-9_-]{1,128}$/.test(options.uid))
    || (options.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(options.email))) throw new Error('Vai trò, UID hoặc email không hợp lệ.');
  if (options.apply && !options.operator?.trim()) throw new Error('--apply cần --operator là danh tính người thực hiện để ghi audit.');
  return options;
}
async function main(options) {
  const { role, project, operator } = options;
  initializeApp({ projectId: project, credential: applicationDefault() });
  const target = options.email ? await getAuth().getUserByEmail(options.email) : await getAuth().getUser(options.uid);
  const uid = target.uid; // Never create an account automatically.
  const db = getFirestore();
  const ref = db.doc(`users/${uid}`);
  const before = (await ref.get()).data();
  if (!before) throw new Error('Tài khoản Auth có tồn tại nhưng chưa có hồ sơ users. Đăng nhập website để tạo hồ sơ trước.');
  console.log(`Project: ${project}\nEmail: ${target.email || '(không có)'}\nUID: ${uid}\nVai trò: ${before.role} -> ${role}\nChế độ: ${options.apply ? 'APPLY' : 'DRY RUN — chưa thay đổi dữ liệu'}`);
  if (!options.apply) return;
  await db.runTransaction(async tx => {
    const current = (await tx.get(ref)).data();
    if (!current || current.role !== before.role) throw new Error('Concurrent role change');
    tx.update(ref, { role });
    tx.set(db.collection('accessAudit').doc(), { actorUid: operator, action: 'operator-role-change', target: ref.path,
      before: { role: current.role }, after: { role }, createdAt: FieldValue.serverTimestamp() });
  });
  console.log('Đã cập nhật vai trò và ghi audit.');
  try { await getAuth().revokeRefreshTokens(uid); }
  catch { console.error('Vai trò đã cập nhật, nhưng chưa thu hồi được phiên đăng nhập. Không coi đây là lỗi cấp quyền; yêu cầu tài khoản đăng xuất và đăng nhập lại.'); process.exitCode = 1; }
}
if (require.main === module) {
  let options;
  try { options = parseArgs(args); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
  if (options) main(options).catch(e => {
    if (e.code === 'auth/user-not-found') console.error('Không tìm thấy tài khoản này trong Firebase Authentication của project đã chọn.');
    else if (!e.code && e.message?.startsWith('Tài khoản Auth')) console.error(e.message);
    else console.error('Không thể xác thực hoặc đọc Firebase. Kiểm tra GOOGLE_APPLICATION_CREDENTIALS trỏ tới service account JSON của đúng project và quyền Firebase Auth/Firestore.');
    process.exitCode = 1;
  });
}
module.exports = { parseArgs };
