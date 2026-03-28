/**
 * PreviewPanel — Renders content from executed JSON Actions.
 * Supports real React TSX rendering via Tailwind CDN + srcdoc iframe.
 */

import { useState, useEffect, useRef } from "react";
import { RefreshCw, ExternalLink, Globe, Smartphone, Monitor, Tablet, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLocalServerRunning } from "@/lib/local-executor";

type ViewMode = "desktop" | "tablet" | "mobile";

const viewStyles: Record<ViewMode, { width: string; className: string }> = {
  desktop: { width: "100%", className: "" },
  tablet: { width: "768px", className: "mx-auto" },
  mobile: { width: "375px", className: "mx-auto" },
};

/** Build preview HTML from executed action outputs */
function buildPreviewHtml(files: Record<string, string>): string {
  const htmlFiles = Object.entries(files).filter(([p]) => p.endsWith(".html"));
  const cssFiles = Object.entries(files).filter(([p]) => p.endsWith(".css"));
  const tsxFiles = Object.entries(files).filter(([p]) => p.endsWith(".tsx") || p.endsWith(".jsx"));
  const jsonFiles = Object.entries(files).filter(([p]) => p.endsWith(".json"));
  const allFiles = Object.entries(files);

  // Direct HTML files
  if (htmlFiles.length > 0) return htmlFiles[0][1];

  const allCss = cssFiles.map(([, c]) => c).join("\n");

  // TSX/JSX files — render with Babel standalone + React CDN
  if (tsxFiles.length > 0) {
    // Pick the main page component (largest file or first)
    const mainFile = tsxFiles.sort((a, b) => b[1].length - a[1].length)[0];
    const componentCode = mainFile[1];

    // Extract the component for browser rendering
    const processedCode = transformTSXForBrowser(componentCode);

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7/babel.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; min-height: 100vh; }
    ${allCss}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-type="module">
    const { useState, useEffect, useCallback, useRef, useMemo } = React;
    ${processedCode}
  </script>
</body>
</html>`;
  }

  // JSON descriptor files — show as formatted cards
  if (jsonFiles.length > 0 && tsxFiles.length === 0) {
    const cards = jsonFiles.map(([path, content]) => {
      let parsed: any;
      try { parsed = JSON.parse(content); } catch { parsed = content; }
      const title = typeof parsed === "object" && parsed?.name ? parsed.name : path.split("/").pop();
      return `<div class="card">
        <div class="card-header">${escapeHtml(String(title))}</div>
        <div class="card-path">${escapeHtml(path)}</div>
        <pre>${escapeHtml(typeof parsed === "object" ? JSON.stringify(parsed, null, 2) : String(content))}</pre>
      </div>`;
    }).join("\n");

    return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
  .card-header { padding: 12px 16px; font-weight: 600; font-size: 16px; color: #60a5fa; border-bottom: 1px solid #334155; }
  .card-path { padding: 4px 16px; font-size: 11px; color: #64748b; }
  pre { padding: 16px; font-size: 12px; line-height: 1.6; overflow-x: auto; color: #94a3b8; }
</style></head><body><h1 style="margin-bottom:20px;font-size:20px;color:#f1f5f9">📁 الملفات المُولَّدة (${allFiles.length})</h1>${cards}</body></html>`;
  }

  // Fallback: show all files as code
  const codeDisplay = allFiles
    .map(([path, content]) => `<div class="file-block"><div class="file-name">${escapeHtml(path)}</div><pre><code>${escapeHtml(content)}</code></pre></div>`)
    .join("\n");

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'SF Mono','Fira Code',monospace;background:#0d1117;color:#c9d1d9;padding:20px}.file-block{margin-bottom:24px;border:1px solid #30363d;border-radius:8px;overflow:hidden}.file-name{background:#161b22;padding:8px 16px;font-size:13px;color:#58a6ff;border-bottom:1px solid #30363d}pre{padding:16px;overflow-x:auto;font-size:13px;line-height:1.6}${allCss}</style></head><body>${codeDisplay}</body></html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Transform TSX component code to work in browser with React CDN.
 * Strips imports, converts to IIFE that renders into #root.
 */
function transformTSXForBrowser(code: string): string {
  let processed = code;

  // Remove all import statements
  processed = processed.replace(/^import\s+.*?;\s*$/gm, "");

  // Remove TypeScript type annotations from useState generics
  processed = processed.replace(/useState<[^>]+>/g, "useState");

  // Extract component name and body
  const funcMatch = processed.match(/(?:const|function)\s+(\w+)\s*=?\s*\(?\)?\s*(?:=>)?\s*\{/);
  const componentName = funcMatch ? funcMatch[1] : "App";

  // Remove "export default ComponentName;" at the end
  processed = processed.replace(/export\s+default\s+\w+\s*;?\s*$/, "");

  // Add render call
  processed += `\n\nReactDOM.createRoot(document.getElementById("root")).render(React.createElement(${componentName}));`;

  return processed;
}

interface PreviewPanelProps {
  generatedFiles?: Record<string, string>;
}

const PreviewPanel = ({ generatedFiles }: PreviewPanelProps) => {
  const [url, setUrl] = useState("http://localhost:5173");
  const [inputUrl, setInputUrl] = useState(url);
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [refreshKey, setRefreshKey] = useState(0);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");
  const [previewMode, setPreviewMode] = useState<"url" | "generated">("url");

  // Only switch to generated preview when executed files arrive
  useEffect(() => {
    if (generatedFiles && Object.keys(generatedFiles).length > 0) {
      setPreviewMode("generated");
      setRefreshKey((k) => k + 1);
    }
  }, [generatedFiles]);

  useEffect(() => {
    const check = async () => {
      const up = await isLocalServerRunning();
      setServerStatus(up ? "online" : "offline");
    };
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = () => {
    setPreviewMode("url");
    setUrl(inputUrl);
    setRefreshKey((k) => k + 1);
  };

  const previewHtml = generatedFiles && Object.keys(generatedFiles).length > 0
    ? buildPreviewHtml(generatedFiles)
    : null;

  return (
    <div className="flex flex-col h-full bg-[hsl(220,25%,6%)]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20 bg-[hsl(220,20%,10%)]">
        <div className="flex items-center gap-1.5 mr-2">
          <div className={`w-2 h-2 rounded-full ${serverStatus === "online" ? "bg-emerald-400 shadow-[0_0_6px_hsl(142,60%,50%)]" : serverStatus === "offline" ? "bg-red-400" : "bg-yellow-400 animate-pulse"}`} />
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {serverStatus === "online" ? "Executor" : serverStatus === "offline" ? "Virtual" : "..."}
          </span>
        </div>

        <div className="flex items-center gap-0.5 bg-[hsl(220,20%,14%)] rounded-lg p-0.5">
          <button
            onClick={() => { setPreviewMode("url"); setRefreshKey(k => k + 1); }}
            className={`p-1.5 rounded-md transition-all text-[10px] px-2 ${previewMode === "url" ? "bg-[hsl(220,20%,22%)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Globe className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => { if (previewHtml) { setPreviewMode("generated"); setRefreshKey(k => k + 1); } }}
            className={`p-1.5 rounded-md transition-all text-[10px] px-2 ${previewMode === "generated" ? "bg-[hsl(220,20%,22%)] text-foreground" : "text-muted-foreground hover:text-foreground"} ${!previewHtml ? "opacity-30 cursor-not-allowed" : ""}`}
          >
            <Code2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-0.5 bg-[hsl(220,20%,14%)] rounded-lg p-0.5">
          {([
            { mode: "desktop" as const, icon: Monitor },
            { mode: "tablet" as const, icon: Tablet },
            { mode: "mobile" as const, icon: Smartphone },
          ]).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-all ${viewMode === mode ? "bg-[hsl(220,20%,22%)] text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="flex-1 flex items-center gap-1.5 bg-[hsl(220,20%,14%)] rounded-lg px-2.5 py-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <input
            value={previewMode === "generated" ? "preview://generated-app" : inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
            readOnly={previewMode === "generated"}
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/40"
            placeholder="http://localhost:5173"
          />
        </div>

        <Button variant="ghost" size="icon" onClick={() => setRefreshKey((k) => k + 1)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (previewMode === "generated" && previewHtml) {
              const w = window.open();
              if (w) { w.document.write(previewHtml); w.document.close(); }
            } else {
              window.open(url, "_blank");
            }
          }}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-0">
        <div
          className={`h-full transition-all duration-300 ${viewStyles[viewMode].className}`}
          style={{ width: viewStyles[viewMode].width, maxWidth: "100%" }}
        >
          {previewMode === "generated" && previewHtml ? (
            <iframe
              key={`gen-${refreshKey}`}
              srcDoc={previewHtml}
              className="w-full h-full border-0 bg-white"
              title="Generated App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : (
            <iframe
              key={`url-${refreshKey}`}
              src={url}
              className="w-full h-full border-0 bg-white"
              title="App Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
