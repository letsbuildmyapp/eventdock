import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface State {
  error: Error | null;
}

/**
 * Top-level error boundary. Wraps the entire app — including BrowserRouter —
 * so it must NOT use react-router primitives in its fallback (the router is
 * unmounted during the error path). Plain <a> only.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[eventdock] uncaught error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center px-5 bg-paper text-ink">
        <div className="card p-10 sm:p-14 max-w-xl text-center">
          <div className="size-16 mx-auto rounded-2xl border-2 border-ink bg-danger/10 grid place-items-center text-danger">
            <AlertTriangle size={32} />
          </div>
          <div className="font-display text-5xl font-extrabold mt-4 leading-none">500</div>
          <h1 className="font-display text-2xl font-bold mt-2">Something tipped over.</h1>
          <p className="text-muted mt-2 break-words">{this.state.error.message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <a href="/" className="btn-primary">Reload home</a>
            <button onClick={() => window.location.reload()} className="btn-ghost">Try again</button>
          </div>
        </div>
      </div>
    );
  }
}
