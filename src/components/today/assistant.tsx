"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  Download,
  FilePlus2,
  Sparkles,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveAssistantDraft } from "@/app/actions/notes";

const MODELS = [
  { key: "sonnet", label: "Sonnet", hint: "fast · high effort" },
  { key: "opus", label: "Opus", hint: "deepest · high effort" },
] as const;
type ModelKey = (typeof MODELS)[number]["key"];

const SUGGESTIONS = [
  "Summarize my week across notes and tasks",
  "Pull together all meeting notes from this month, ready to export",
  "Draft a status email from my recent notes",
];

export function Assistant() {
  const [prompt, setPrompt] = React.useState("");
  const [model, setModel] = React.useState<ModelKey>("sonnet");
  const [output, setOutput] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);
  const outputRef = React.useRef<HTMLDivElement>(null);

  const run = async () => {
    const q = prompt.trim();
    if (!q || running) return;
    setRunning(true);
    setOutput("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q, model }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error((err as Error).message);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `better-assistant-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAsNote = async () => {
    // First markdown heading (or the prompt) becomes the note title.
    const heading = /^#{1,3}\s+(.+)$/m.exec(output)?.[1];
    const note = await saveAssistantDraft(heading ?? prompt.slice(0, 80), output);
    toast(`Saved as note "${note.title}"`, {
      action: {
        label: "Open",
        onClick: () => (window.location.href = `/notes/${note.id}`),
      },
    });
  };

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Ask Better</h2>
        <span className="text-xs text-muted-foreground">
          synthesize notes, summarize weeks, draft emails
        </span>
        <div
          className="ml-auto flex items-center rounded-full border border-border p-0.5"
          role="radiogroup"
          aria-label="Model"
        >
          {MODELS.map((m) => (
            <button
              key={m.key}
              role="radio"
              aria-checked={model === m.key}
              onClick={() => setModel(m.key)}
              title={m.hint}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                model === m.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-end gap-2 px-4 py-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              run();
            }
          }}
          placeholder='e.g. "Pull together all notes about the offsite from June and July, ready to export"'
          className="min-h-10 flex-1 resize-none text-sm"
          rows={1}
        />
        {running ? (
          <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={stop}>
            <Square className="size-3" /> Stop
          </Button>
        ) : (
          <Button size="sm" className="gap-1.5 rounded-full" onClick={run} disabled={!prompt.trim()}>
            <Sparkles className="size-3.5" /> Ask
          </Button>
        )}
      </div>

      {!output && !running && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {(output || running) && (
        <div className="border-t border-border/60">
          <div
            ref={outputRef}
            className="prose prose-sm dark:prose-invert max-h-[28rem] max-w-none overflow-y-auto px-5 py-4 prose-headings:font-semibold prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5"
          >
            {output ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
            ) : (
              <p className="animate-pulse text-sm text-muted-foreground">
                Reading your workspace…
              </p>
            )}
          </div>
          {output && !running && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-border/60 px-4 py-2">
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 rounded-full text-xs" onClick={copy}>
                {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 rounded-full text-xs" onClick={saveAsNote}>
                <FilePlus2 className="size-3" /> Save as note
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1.5 rounded-full text-xs" onClick={download}>
                <Download className="size-3" /> Download .md
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
