import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("MatchMind UI error", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error">
          <div className="app-error-mark">MM</div>
          <h1>MatchMind hit an unexpected UI error.</h1>
          <p>{this.state.error.message}</p>
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
