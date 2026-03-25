import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, Globe, Smartphone, Monitor, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLocalServerRunning } from "@/lib/local-executor";

type ViewMode = "desktop" | "tablet" | "mobile";

const viewStyles: Record<ViewMode, { width: string; className: string }> = {
  desktop: { width: "100%", className: "" },
  tablet: { width: "768px", className: "mx-auto" },
  mobile: { width: "375px", className: "mx-auto" },
};

const PreviewPanel = () => {
  const [url, setUrl] = useState("http://localhost:5173");
  const [inputUrl, setInputUrl] = useState(url);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const check = async () => {
      const up = await isLocalServerRunning();
      setServerStatus(up ? "online" : "offline");
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = () => {
    setUrl(inputUrl);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(220,25%,6%)]">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-[hsl(220,20%,10%)]">
        {/* Server status */}
        <div className="flex items-center gap-1.5 mr-2">
          <div
            className={`w-2 h-2 rounded-full ${
              serverStatus === "online"
                ? "bg-emerald-400 shadow-[0_0_6px_hsl(142,60%,50%)]"
                : serverStatus === "offline"
                ? "bg-red-400"
                : "bg-yellow-400 animate-pulse"
            }`}
          />
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {serverStatus === "online" ? "Executor" : serverStatus === "offline" ? "Offline" : "..."}
          </span>
        </div>

        {/* View mode toggles */}
        <div className="flex items-center gap-0.5 bg-[hsl(220,20%,14%)] rounded-lg p-0.5">
          {([
            { mode: "desktop" as const, icon: Monitor },
            { mode: "tablet" as const, icon: Tablet },
            { mode: "mobile" as const, icon: Smartphone },
          ]).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === mode
                  ? "bg-[hsl(220,20%,22%)] text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-1.5 bg-[hsl(220,20%,14%)] rounded-lg px-2.5 py-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
            placeholder="http://localhost:5173"
          />
        </div>

        {/* Actions */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.open(url, "_blank")}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 overflow-hidden p-0">
        <div
          className={`h-full transition-all duration-300 ${viewStyles[viewMode].className}`}
          style={{ width: viewStyles[viewMode].width, maxWidth: "100%" }}
        >
          <iframe
            key={refreshKey}
            src={url}
            className="w-full h-full border-0 bg-white"
            title="App Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
