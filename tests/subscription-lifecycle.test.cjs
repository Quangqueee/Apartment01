const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-typescript.cjs');
const { managedSubscription } = load('src/lib/subscription-lifecycle.ts');
test('Strict Mode cancelled mount does not start a Firestore watch target', () => {
  const tasks = []; let starts = 0, stops = 0;
  const start = () => { starts++; return () => stops++; };
  const stopFirst = managedSubscription(start, () => {}, assert.fail, cb => tasks.push(cb));
  stopFirst();
  const stopSecond = managedSubscription(start, () => {}, assert.fail, cb => tasks.push(cb));
  tasks.forEach(cb => cb());
  assert.equal(starts, 1); assert.equal(stops, 0);
  stopSecond(); stopSecond(); assert.equal(stops, 1);
});
test('old account callbacks and errors are ignored after cleanup', async () => {
  let oldNext, oldError, stopped = 0;
  const values = [], errors = [];
  const stop = managedSubscription((next, error) => { oldNext = next; oldError = error; return () => stopped++; },
    value => values.push(value), error => errors.push(error));
  await Promise.resolve(); oldNext('current'); stop(); oldNext('stale'); oldError(new Error('old session'));
  assert.deepEqual(values, ['current']); assert.equal(errors.length, 0); assert.equal(stopped, 1);
});
test('setup errors reach the error handler without an uncaught microtask rejection', async () => {
  const errors = [];
  const stop = managedSubscription(() => { throw new Error('setup failed'); }, assert.fail, e => errors.push(e.message));
  await Promise.resolve(); assert.deepEqual(errors, ['setup failed']); stop();
});
test('permission errors are delivered instead of hiding denied access', async () => {
  const errors = [];
  const stop = managedSubscription((next, error) => { error(new Error('permission-denied')); return () => {}; }, assert.fail, e => errors.push(e.message));
  await Promise.resolve(); assert.deepEqual(errors, ['permission-denied']); stop();
});
