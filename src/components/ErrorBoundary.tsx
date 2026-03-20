import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/health-monitor";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackTitleAr?: string;
  moduleName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private autoRetryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const module = this.props.moduleName || "unknown";
    console.error(`[SelfHealing] Error in ${module}:`, error, errorInfo);
    logError({
      module,
      message: error.message,
      stack: errorInfo.componentStack || error.stack || "",
      timestamp: new Date().toISOString(),
      severity: "critical",
    });
    this.props.onError?.(error, errorInfo);

    // Auto-retry once after 3 seconds for transient failures
    if (this.state.retryCount === 0) {
      this.autoRetryTimer = setTimeout(() => {
        this.handleRetry();
      }, 3000);
    }
  }

  componentWillUnmount() {
    if (this.autoRetryTimer) clearTimeout(this.autoRetryTimer);
  }

  handleRetry = () => {
    if (this.autoRetryTimer) {
      clearTimeout(this.autoRetryTimer);
      this.autoRetryTimer = null;
    }
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      const lang = document.documentElement.getAttribute("lang");
      const isAr = lang === "ar";
      const title = isAr
        ? this.props.fallbackTitleAr || "حدث خطأ في هذا المكون"
        : this.props.fallbackTitle || "This module encountered an error";
      const module = this.props.moduleName || "module";

      return (
        <div className="sf-glass rounded-2xl p-6 text-center space-y-4 animate-in fade-in duration-300">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
            </div>
          </div>
          <h3 className="text-foreground font-semibold">{title}</h3>
          <p className="text-muted-foreground text-sm">
            {isAr
              ? `المكوّن "${module}" واجه مشكلة. باقي التطبيق يعمل بشكل طبيعي.`
              : `The "${module}" component failed gracefully. The rest of the app continues working.`}
          </p>
          {this.state.error && (
            <p className="text-xs text-destructive/60 font-mono truncate max-w-full px-4">
              {this.state.error.message}
            </p>
          )}
          <div className="flex justify-center gap-2">
            {this.state.retryCount < 3 && (
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="sf-glass-subtle border-foreground/20 text-foreground"
              >
                <RefreshCw className="h-4 w-4 me-2" />
                {isAr ? `إعادة المحاولة (${3 - this.state.retryCount})` : `Retry (${3 - this.state.retryCount} left)`}
              </Button>
            )}
            {this.state.retryCount >= 3 && (
              <p className="text-xs text-muted-foreground">
                {isAr ? "استُنفدت محاولات الإصلاح التلقائي" : "Auto-heal attempts exhausted"}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
