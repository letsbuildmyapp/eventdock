import { Link } from 'react-router-dom';

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 group" data-tour="brand">
      <div className="h-9 w-9 rounded-2xl border-2 border-ink bg-accent grid place-items-center shadow-[3px_3px_0_0_rgb(var(--ink))] group-hover:rotate-[-4deg] transition-transform">
        <span className="text-base font-black">E</span>
      </div>
      <span className="font-display font-extrabold text-xl tracking-tight">EventDock</span>
    </Link>
  );
}
