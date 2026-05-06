import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-5 bg-paper">
      <div className="card p-10 sm:p-14 max-w-lg text-center">
        <div className="text-7xl">🪧</div>
        <div className="font-display text-5xl font-extrabold mt-4 leading-none">404</div>
        <h1 className="font-display text-2xl font-bold mt-2">Nothing here.</h1>
        <p className="text-muted mt-2">Either the page moved or someone gave you a wrong link.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex">Take me home</Link>
      </div>
    </div>
  );
}
