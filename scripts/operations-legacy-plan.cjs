const SOURCES = ['user_bookings', 'ctv_bookings', 'guest_consultations', 'customerLeads'];
const keyPattern = /^(user_bookings|ctv_bookings|guest_consultations|customerLeads)~[A-Za-z0-9_-]{1,128}$/;
function planLegacyLeads(records, cutoff, customerIds = new Set()) {
  const cutoffMillis = Date.parse(cutoff);
  if (!Number.isFinite(cutoffMillis)) throw new Error('A trusted policy cutoff is required');
  const eligible = [], unresolved = [], current = [], linked = [], bookings = [];
  for (const record of records) {
    if (!SOURCES.includes(record.collection)) throw new Error('Invalid lead source');
    const key = `${record.collection}~${record.id}`;
    if (!keyPattern.test(key)) throw new Error('Invalid lead key');
    // The SDK's document createTime is authoritative; data.createdAt is never evidence.
    const created = record.createTime?.toDate ? record.createTime.toDate().toISOString() : record.createTime;
    if (!created || !Number.isFinite(Date.parse(created))) { unresolved.push(key); continue; }
    if (record.collection !== 'customerLeads' && Date.parse(created) <= cutoffMillis) bookings.push({ key, createTime: created });
    if (record.collection === 'user_bookings' && record.data.isExternal !== true && customerIds.has(record.data.userId)) { linked.push(key); continue; }
    if (Date.parse(created) <= cutoffMillis) eligible.push({ key, createTime: created });
    else current.push(key);
  }
  return { eligible: eligible.sort((a, b) => a.key.localeCompare(b.key)), bookings: bookings.sort((a, b) => a.key.localeCompare(b.key)), unresolved: unresolved.sort(), current: current.sort(), linked: linked.sort() };
}
module.exports = { planLegacyLeads, SOURCES, keyPattern };
