import { RotateCcw } from 'lucide-react';
import { useConfirm } from './ConfirmModal';
import { resetSeed } from '../lib/seed';

export function ResetDemo() {
  const confirm = useConfirm();

  async function reset() {
    const ok = await confirm({
      title: 'Reset the demo?',
      message: <>Clears every event, ticket, and tour flag, then reloads with the seeded catalog. Useful between sales calls.</>,
      confirmLabel: 'Reset',
      destructive: true,
    });
    if (!ok) return;
    resetSeed();
    window.location.assign('/');
  }

  return (
    <button
      onClick={reset}
      className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] font-bold text-muted hover:text-danger transition-colors"
      aria-label="Reset demo"
    >
      <RotateCcw size={12} /> Reset demo
    </button>
  );
}
