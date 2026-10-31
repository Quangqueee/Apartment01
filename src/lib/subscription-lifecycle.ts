/** Defer setup until after React's synchronous mount/cleanup cycle.
 * Cancelled subscriptions never start, and callbacks from a former session are ignored.
 */
export function managedSubscription<T>(
  start: (next: (value: T) => void, error: (error: Error) => void) => () => void,
  next: (value: T) => void,
  error: (error: Error) => void,
  schedule: (callback: () => void) => void = queueMicrotask,
): () => void {
  let active = true;
  let unsubscribe: (() => void) | undefined;
  const fail = (cause: unknown) => {
    if (active) error(cause instanceof Error ? cause : new Error('Không thể theo dõi dữ liệu.'));
  };
  schedule(() => {
    if (!active) return;
    try { unsubscribe = start(value => { if (active) next(value); }, fail); }
    catch (cause) { fail(cause); }
  });
  return () => {
    if (!active) return;
    active = false;
    try { unsubscribe?.(); }
    catch (cause) {
      // Surface a broken SDK queue as an error, never as an uncaught cleanup exception.
      error(cause instanceof Error ? cause : new Error('Không thể đóng kết nối dữ liệu.'));
    }
    unsubscribe = undefined;
  };
}
