/** No inferred ownership. The reviewed mapping is supplied by a trusted operator. */
function planOwnership(records, adminIds, mapping = []) {
  const byPath = new Map(mapping.map(item => [`${item.collection}/${item.id}`, item]));
  if (byPath.size !== mapping.length) throw new Error('Duplicate ownership mapping');
  const changes = [], unresolved = [], conflicts = [];
  for (const record of records) {
    const path = `${record.collection}/${record.id}`;
    const item = byPath.get(path);
    byPath.delete(path);
    if (record.data.ownerAdminId) {
      if (item && item.ownerAdminId !== record.data.ownerAdminId) conflicts.push(path);
      continue;
    }
    if (!item) { unresolved.push(path); continue; }
    if (!adminIds.has(item.ownerAdminId) || !item.evidence?.trim()) throw new Error(`Invalid reviewed mapping: ${path}`);
    if (record.collection === 'users' && ['admin', 'director'].includes(record.data.role)) throw new Error(`Cannot assign privileged account: ${path}`);
    changes.push({ path, ownerAdminId: item.ownerAdminId });
  }
  if (byPath.size) throw new Error('Mapping references missing records');
  return { changes, unresolved, conflicts };
}
module.exports = { planOwnership };
