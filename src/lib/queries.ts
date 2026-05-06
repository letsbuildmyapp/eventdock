import { useEffect, useState } from 'react';
import { db } from './store';

/** Subscribe a component to db changes; returns a stable counter that bumps on any mutation. */
export function useDbVersion() {
  const [v, setV] = useState(0);
  useEffect(() => db.subscribe(() => setV((x) => x + 1)), []);
  return v;
}
