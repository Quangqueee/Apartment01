export const WORK_TIME_ZONE = 'Asia/Bangkok';
export type WorkBooking = { id: string; collection: string; type?: string; status: string; dateTime?: string;
  name?: string; clientName?: string; phone?: string; clientPhone?: string; apartmentCode?: string; ctvName?: string;
  assignedAdminId?: string | null; assignedAdminName?: string; assignmentVersion?: string; createdAt?: { seconds: number } };
export const bookingKey = (b: Pick<WorkBooking, 'collection' | 'id'>) => `${b.collection}/${b.id}`;
export const closedBooking = (b: Pick<WorkBooking, 'status'>) => ['contacted', 'failed'].includes(b.status);
export const searchText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
export function workDate(now = new Date()) { return new Intl.DateTimeFormat('sv-SE', { timeZone: WORK_TIME_ZONE }).format(now); }
export function bookingSlot(b: Pick<WorkBooking, 'dateTime'>) {
  if (b.dateTime && /(?:Z|[+-]\d{2}:\d{2})$/.test(b.dateTime)) {
    const date = new Date(b.dateTime);
    if (!Number.isFinite(date.getTime())) return { day: '', time: '' };
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: WORK_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || '';
    return { day: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
  }
  const match = b.dateTime?.match(/^(\d{4}-\d{2}-\d{2})(?:T|\s)?(\d{2}:\d{2})?/);
  if (match) {
    const date = new Date(`${match[1]}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== match[1] || match[2] && (+match[2].slice(0, 2) > 23 || +match[2].slice(3) > 59)) return { day: '', time: '' };
  }
  return { day: match?.[1] || '', time: match?.[2] || '' };
}
export function bookingWhen(b: Pick<WorkBooking, 'dateTime'>) {
  const slot = bookingSlot(b); if (!slot.day) return 'Chưa xác định ngày / giờ';
  return `${slot.day.split('-').reverse().join('/')} · ${slot.time || 'Chưa có giờ'}`;
}
export function filterWorkBookings(rows: WorkBooking[], filters: { search: string; assignment: string; status: string; day: string; source: string; adminUid: string }, now = new Date()) {
  const needle = searchText(filters.search), today = workDate(now);
  return rows.filter(b => (!needle || searchText(`${b.name || ''} ${b.clientName || ''} ${b.phone || ''} ${b.clientPhone || ''} ${b.apartmentCode || ''} ${b.ctvName || ''} ${b.assignedAdminName || ''}`).includes(needle))
    && (filters.assignment === 'all' || filters.assignment === 'unassigned' && !b.assignedAdminId || filters.assignment === 'assigned' && !!b.assignedAdminId)
    && (filters.status === 'all' || (filters.status === 'open' ? !closedBooking(b) : b.status === filters.status))
    && (filters.day === 'all' || filters.day === 'today' && bookingSlot(b).day === today || filters.day === 'overdue' && !closedBooking(b) && !!bookingSlot(b).day && bookingSlot(b).day < today)
    && (filters.source === 'all' || b.type === filters.source)
    && (!filters.adminUid || b.assignedAdminId === filters.adminUid))
    .sort((a, b) => {
      const aSlot = bookingSlot(a), bSlot = bookingSlot(b);
      return (aSlot.day ? `${aSlot.day} ${aSlot.time}` : '9999').localeCompare(bSlot.day ? `${bSlot.day} ${bSlot.time}` : '9999')
        || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });
}
export function workLoad(rows: WorkBooking[], adminUid: string, now = new Date()) {
  const active = rows.filter(b => b.assignedAdminId === adminUid && !closedBooking(b)), today = workDate(now);
  return { active: active.length, today: active.filter(b => bookingSlot(b).day === today).length,
    overdue: active.filter(b => !!bookingSlot(b).day && bookingSlot(b).day < today).length };
}
export function assignmentPreview(rows: WorkBooking[], selected: string[], target: string | null, all: WorkBooking[]) {
  const picked = rows.filter(b => selected.includes(bookingKey(b))), open = picked.filter(b => !closedBooking(b));
  const changes = open.filter(b => (b.assignedAdminId || null) !== target);
  const slots = changes.map(bookingSlot).filter(s => s.day && s.time).map(s => `${s.day} ${s.time}`);
  const existingSlots = new Set(all.filter(b => b.assignedAdminId === target && !closedBooking(b) && !changes.some(c => bookingKey(c) === bookingKey(b)))
    .map(bookingSlot).filter(s => s.day && s.time).map(s => `${s.day} ${s.time}`));
  const conflicts = target ? new Set(slots.filter((slot, i) => existingSlots.has(slot) || slots.indexOf(slot) !== i)).size : 0;
  const phoneKey = (b: WorkBooking) => { const digits = (b.clientPhone || b.phone || '').replace(/\D/g, ''); return digits.length === 11 && digits.startsWith('84') ? `0${digits.slice(2)}` : digits; };
  const phoneCounts = new Map<string, number>();
  for (const b of all.filter(b => !closedBooking(b))) { const phone = phoneKey(b); if (phone.length >= 8) phoneCounts.set(phone, (phoneCounts.get(phone) || 0) + 1); }
  const duplicateContacts = new Set(changes.map(phoneKey).filter(phone => (phoneCounts.get(phone) || 0) > 1)).size;
  return { changes, selected: selected.length, missing: selected.length - picked.length, closed: picked.length - open.length,
    unchanged: open.length - changes.length, reassigning: changes.filter(b => !!b.assignedAdminId).length, conflicts, duplicateContacts };
}
export function assignmentVersion(data: { assignedAdminId?: string | null; assignedAt?: any }) {
  const at = data.assignedAt;
  return `${data.assignedAdminId || '-'}@${typeof at?.seconds === 'number' ? `${at.seconds}:${at.nanoseconds || 0}` : typeof at === 'string' ? at : '-'}`;
}
