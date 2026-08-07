import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Without this, any error thrown during render unmounts the whole tree and the
 * user is left staring at a white page with no way forward. This turns that into
 * something they can act on, and keeps the details for the console.
 */
interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Lumi crashed while rendering:', error, info.componentStack);
  }

  private reset = () => {
    // A bad persisted store is the most likely cause of a repeatable crash, so
    // offer a path that clears it without touching the account itself.
    try {
      localStorage.removeItem('lumi-v2');
    } catch { /* private browsing */ }
    window.location.href = '/';
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash-screen">
        <div className="crash-emoji">🌱</div>
        <h1 className="crash-title">Something went wrong</h1>
        <p className="crash-sub">
          Lumi hit an unexpected error. Reloading usually fixes it — your progress is saved.
        </p>
        <div className="crash-actions">
          <button className="crash-btn" onClick={() => window.location.reload()}>Reload</button>
          <button className="crash-btn crash-btn--ghost" onClick={this.reset}>Reset and start over</button>
        </div>
      </div>
    );
  }
}
