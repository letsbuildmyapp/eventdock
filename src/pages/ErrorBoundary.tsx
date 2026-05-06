import { useRouteError, Link } from 'react-router-dom';

export default function ErrorBoundary() {
  const err = useRouteError() as Error;
  return (
    <div className="min-h-screen grid place-items-center px-5 bg-paper">
      <div className="card p-10 sm:p-14 max-w-xl text-center">
        <div className="text-7xl">💥</div>
        <div className="font-display text-5xl font-extrabold mt-4 leading-none">500</div>
        <h1 className="font-display text-2xl font-bold mt-2">Something tipped over.</h1>
        <p className="text-muted mt-2 break-words">{err?.message ?? 'Unknown error'}</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Reload home</Link>
      </div>
    </div>
  );
}
