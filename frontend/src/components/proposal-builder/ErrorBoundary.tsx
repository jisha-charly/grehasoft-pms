import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card border-danger m-3 text-start">
          <div className="card-body text-danger">
            <h5 className="card-title fw-bold"><i className="bi bi-exclamation-triangle-fill me-2"></i>Section Editor Error</h5>
            <p className="card-text small">This section editor failed to render correctly.</p>
            <pre className="p-2 bg-light text-dark rounded smaller font-monospace" style={{ fontSize: '11px' }}>{this.state.error?.toString()}</pre>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry Rendering
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
