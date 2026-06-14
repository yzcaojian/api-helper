import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("API Helper render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface p-8 text-center">
          <h1 className="text-lg font-semibold text-text-primary">界面加载失败</h1>
          <p className="max-w-lg text-sm text-text-secondary">{this.state.error.message}</p>
          <button
            type="button"
            className="rounded-md bg-accent px-4 py-2 text-sm text-white"
            onClick={() => this.setState({ error: null })}
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
