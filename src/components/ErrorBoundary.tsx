import { Component, ErrorInfo, ReactNode } from "react";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 p-4">
          <div className="text-center">
            <h1 className="font-bold text-red-400 mb-2">{i18n.t('error')}</h1>
            <p className="mb-4">{i18n.t('Something went wrong')}</p>
            <pre className="text-xs text-slate-500 max-w-md mx-auto overflow-auto">{this.state.error?.message}</pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 btn-primary"
            >
              {i18n.t('Refresh')}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
