import assert from 'node:assert/strict';
import test from 'node:test';
import { blockedStayDate, quoteStay, stayInterval, stayIntervalsOverlap } from '../src/lib/stay-pricing.ts';

const apartment = { nightlyPrice: 800_000, weeklyPrice: 4_800_000, hourlyPrice: 120_000,
  minNights: 1, minHours: 2, checkInTime: '14:00', checkOutTime: '12:00' };

test('giá tuần cộng đêm lẻ và mốc trả phòng không tính đêm', () => {
  const quote = quoteStay(apartment, { stayType: 'nightly', checkIn: '2026-11-01', checkOut: '2026-11-09' });
  assert.equal(quote.nights, 8);
  assert.equal(quote.totalAmount, 5_600_000);
  assert.equal(blockedStayDate({ stayType: 'nightly', checkIn: '2026-11-01', checkOut: '2026-11-09' }, ['2026-11-09']), false);
  assert.equal(blockedStayDate({ stayType: 'nightly', checkIn: '2026-11-01', checkOut: '2026-11-09' }, ['2026-11-08']), true);
});

test('theo giờ kết thúc cùng ngày và không nhận khoảng qua nửa đêm', () => {
  const quote = quoteStay(apartment, { stayType: 'hourly', checkIn: '2026-11-01', startTime: '10:00', hours: 3 });
  assert.equal(quote.totalAmount, 360_000);
  assert.equal(quote.checkOutAt, '2026-11-01T13:00');
  assert.throws(() => quoteStay(apartment, { stayType: 'hourly', checkIn: '2026-11-01', startTime: '22:00', hours: 3 }));
});

test('lịch theo giờ và qua đêm chỉ xung đột khi giao nhau', () => {
  const morning = stayInterval({ bookingSchemaVersion: 2, stayType: 'hourly', checkInAt: '2026-11-01T10:00', checkOutAt: '2026-11-01T12:00' }, apartment);
  const afternoon = stayInterval({ checkIn: '2026-11-01', checkOut: '2026-11-02' }, apartment);
  const late = stayInterval({ bookingSchemaVersion: 2, stayType: 'hourly', checkInAt: '2026-11-01T15:00', checkOutAt: '2026-11-01T17:00' }, apartment);
  assert.equal(stayIntervalsOverlap(morning, afternoon), false);
  assert.equal(stayIntervalsOverlap(late, afternoon), true);
});
