import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Globe,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/shared/ui";
import { toast } from "@/shared/ui/Toast";

const DEFAULT_HEADERS = `{
  "Accept": "application/json",
  "Content-Type": "application/json"
}`;

const DEFAULT_BODY = `{
  "name": "Yolnoma",
  "status": "online"
}`;

export default function ApiTestingStudioPage() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState(
    "https://jsonplaceholder.typicode.com/todos/1",
  );
  const [headers, setHeaders] = useState(DEFAULT_HEADERS);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [response, setResponse] = useState<{
    status: number;
    ok: boolean;
    time: number;
    headers: Record<string, string>;
    body: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const previewSummary = useMemo(() => {
    if (!response) return "No request sent yet";
    return `${response.status} • ${response.ok ? "Success" : "Request failed"}`;
  }, [response]);

  const submitRequest = async () => {
    if (!url.trim()) {
      toast.error("Please enter a request URL.");
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    try {
      parsedHeaders = headers.trim() ? JSON.parse(headers) : {};
    } catch {
      toast.error("Headers must be valid JSON.");
      return;
    }

    let parsedBody: string | undefined = undefined;
    if (method !== "GET" && method !== "DELETE" && body.trim()) {
      try {
        JSON.parse(body);
        parsedBody = body;
      } catch {
        toast.error("Request body must be valid JSON.");
        return;
      }
    }

    const startedAt = performance.now();
    setLoading(true);

    try {
      const res = await fetch(url, {
        method,
        headers: parsedHeaders,
        body: parsedBody,
      });

      const responseText = await res.text();
      const elapsed = Math.round(performance.now() - startedAt);
      const headersMap: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersMap[key] = value;
      });

      setResponse({
        status: res.status,
        ok: res.ok,
        time: elapsed,
        headers: headersMap,
        body: responseText,
      });

      toast.success(`Request complete: ${res.status}`);
    } catch (error) {
      setResponse(null);
      toast.error(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async () => {
    if (!response) return;
    try {
      await navigator.clipboard.writeText(response.body);
      toast.success("Response copied to clipboard.");
    } catch {
      toast.error("Clipboard access is unavailable.");
    }
  };

  return (
    <div className="mx-auto min-h-full max-w-7xl space-y-8 p-6 text-[var(--text-primary)]">
      <header className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          <Code2 size={18} />
          API Testing Studio
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              Test endpoints without leaving the app
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Send real HTTP requests, inspect status codes, and debug payloads
              in a focused local testing workspace.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/45">
            <ShieldCheck size={14} className="text-emerald-400" /> Local HTTP
            client
          </div>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select
              value={method}
              onChange={(event) => setMethod(event.target.value)}
              className="rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-white outline-none"
            >
              <option>GET</option>
              <option>POST</option>
              <option>PUT</option>
              <option>PATCH</option>
              <option>DELETE</option>
            </select>
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2.5">
              <Globe size={16} className="text-[var(--accent)]" />
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://api.example.com/items"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/25"
              />
            </div>
            <Button
              variant="primary"
              onClick={() => void submitRequest()}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Headers (JSON)
              </label>
              <textarea
                value={headers}
                onChange={(event) => setHeaders(event.target.value)}
                className="h-48 w-full rounded-xl border border-white/[0.08] bg-black/10 p-3 font-mono text-xs text-white/80 outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                Body (JSON)
              </label>
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="h-48 w-full rounded-xl border border-white/[0.08] bg-black/10 p-3 font-mono text-xs text-white/80 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Request summary
          </div>
          <div className="space-y-3 text-sm text-white/70">
            <div className="flex items-center justify-between">
              <span>Method</span>
              <strong className="text-white">{method}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <strong className="text-white">
                {response ? response.status : "-"}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span>Latency</span>
              <strong className="text-white">
                {response ? `${response.time} ms` : "-"}
              </strong>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2 text-xs text-white/60">
              <ArrowRight size={14} className="text-[var(--accent)]" />
              {previewSummary}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Send size={18} className="text-[var(--accent)]" />
            <h2 className="text-xl font-semibold">Response inspector</h2>
          </div>
          {response && (
            <button
              type="button"
              onClick={() => void copyResponse()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs uppercase tracking-[0.12em] text-white/60 hover:text-white"
            >
              <Copy size={12} /> Copy
            </button>
          )}
        </div>

        {response ? (
          <div className="grid gap-4 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                {response.ok ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <Clock3 size={16} className="text-amber-400" />
                )}
                {response.ok ? "Success" : "Failed request"}
              </div>
              <div className="space-y-2 text-xs text-white/60">
                <div className="flex items-center justify-between">
                  <span>HTTP status</span>
                  <strong className="text-white">{response.status}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Response time</span>
                  <strong className="text-white">{response.time} ms</strong>
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  Headers
                </div>
                <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-black/10 p-3 font-mono text-[11px] text-white/70">
                  {JSON.stringify(response.headers, null, 2) || "No headers"}
                </pre>
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/10 p-4">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Body
              </div>
              <pre className="max-h-[26rem] overflow-auto whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-black/10 p-3 font-mono text-[11px] text-white/75">
                {response.body || "No response content"}
              </pre>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/[0.08] bg-black/10 p-10 text-center text-sm text-white/45">
            No request has been sent yet.
          </div>
        )}
      </section>
    </div>
  );
}
