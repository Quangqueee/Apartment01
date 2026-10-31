import { onSnapshot, type DocumentData, type DocumentReference, type DocumentSnapshot,
  type Query, type QuerySnapshot } from 'firebase/firestore';
import { managedSubscription } from './subscription-lifecycle';

export function watchQuery<T extends DocumentData, D extends DocumentData>(target: Query<T, D>,
  next: (snapshot: QuerySnapshot<T, D>) => void, error: (error: Error) => void) {
  return managedSubscription<QuerySnapshot<T, D>>((onNext, onError) => onSnapshot(target, onNext, onError), next, error);
}
export function watchDoc<T extends DocumentData, D extends DocumentData>(target: DocumentReference<T, D>,
  next: (snapshot: DocumentSnapshot<T, D>) => void, error: (error: Error) => void) {
  return managedSubscription<DocumentSnapshot<T, D>>((onNext, onError) => onSnapshot(target, onNext, onError), next, error);
}
