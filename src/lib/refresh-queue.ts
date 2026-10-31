/** Coalesce refresh signals; old sessions and superseded responses never publish data. */
export function createRefreshQueue<T>(read: () => Promise<T>, callbacks: {
  data: (value: T) => void; error: (error: unknown) => void; busy?: (value: boolean) => void;
}, schedule: (task: () => void) => void = queueMicrotask) {
  let closed = false, running = false, scheduled = false, again = false, revision = 0;
  let waiters: (() => void)[] = [];
  const settle = () => { const current = waiters; waiters = []; current.forEach(resolve => resolve()); };
  const flush = async () => {
    scheduled = false;
    if (closed) { settle(); return; }
    running = true; callbacks.busy?.(true);
    do {
      again = false; const current = revision;
      try { const value = await read(); if (!closed && current === revision) callbacks.data(value); }
      catch (error) { if (!closed && current === revision) callbacks.error(error); }
    } while (again && !closed);
    running = false;
    if (!closed) callbacks.busy?.(false);
    settle();
  };
  return {
    request(invalidate = false) {
      if (closed) return Promise.resolve();
      if (invalidate) revision++;
      const done = new Promise<void>(resolve => waiters.push(resolve));
      if (running) again = true;
      else if (!scheduled) { scheduled = true; schedule(() => { void flush(); }); }
      return done;
    },
    fail(error: unknown) { if (!closed) { revision++; again = false; callbacks.error(error); } },
    dispose() { closed = true; revision++; again = false; settle(); },
  };
}
