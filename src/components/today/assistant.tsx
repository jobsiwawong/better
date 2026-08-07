"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Check,
  Copy,
  Download,
  FilePlus2,
  Plus,
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

type Message = { role: "user" | "assistant"; content: string };

export function Assistant() {
  const [input, setInput] = React.useState("");
  const [model, setModel] = React.useState<ModelKey>("sonnet");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [running, setRunning] = React.useState(false);
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Keep the conversation scrolled to the latest message as it streams.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || running) return;

    // Append the user turn plus an empty assistant turn to stream into.
    const history = [...messages, { role: "user" as const, content: q }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setRunning(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, model }),
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
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = prev.slice();
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error((err as Error).message);
      }
      // Drop a trailing empty assistant turn so a failed ask doesn't linger.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && !last.content) return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const stop = () => abortRef.current?.abort();

  const newChat = () => {
    if (running) stop();
    setMessages([]);
    setInput("");
  };

  const copy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
  };

  const download = (text: string) => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `better-assistant-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveAsNote = async (text: string) => {
    const heading = /^#{1,3}\s+(.+)$/m.exec(text)?.[1];
    const note = await saveAssistantDraft(heading ?? text.slice(0, 80), text);
    toast(`Saved as note "${note.title}"`, {
      action: {
        label: "Open",
        onClick: () => (window.location.href = `/notes/${note.id}`),
      },
    });
  };

  const hasConversation = messages.length > 0;

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">Ask Better</h2>
        <span className="text-xs text-muted-foreground">
          synthesize notes, summarize weeks, draft emails
        </span>
        <div className="ml-auto flex items-center gap-2">
          {hasConversation && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 rounded-full text-xs"
              onClick={newChat}
            >
              <Plus className="size-3" /> New chat
            </Button>
          )}
          <div
            className="flex items-center rounded-full border border-border p-0.5"
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
      </div>

      {hasConversation && (
        <div
          ref={scrollRef}
          className="mt-2 max-h-[32rem] space-y-4 overflow-y-auto border-t border-border/60 px-4 py-4"
        >
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary/10 px-3.5 py-2 text-sm text-foreground">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="space-y-1.5">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5">
                  {m.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {m.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="animate-pulse text-sm text-muted-foreground">
                      Reading your workspace…
                    </p>
                  )}
                </div>
                {m.content && !(running && i === messages.length - 1) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 rounded-full text-xs"
                      onClick={() => copy(m.content, i)}
                    >
                      {copiedIdx === i ? (
                        <Check className="size-3" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      {copiedIdx === i ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 rounded-full text-xs"
                      onClick={() => saveAsNote(m.content)}
                    >
                      <FilePlus2 className="size-3" /> Save as note
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 rounded-full text-xs"
                      onClick={() => download(m.content)}
                    >
                      <Download className="size-3" /> Download .md
                    </Button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-border/60 px-4 py-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={
            hasConversation
              ? "Ask a follow-up… (Shift+Enter for a new line)"
              : 'e.g. "Pull together all notes about the offsite from June and July, ready to export"'
          }
          className="min-h-10 flex-1 resize-none text-sm"
          rows={1}
        />
        {running ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-full"
            onClick={stop}
          >
            <Square className="size-3" /> Stop
          </Button>
        ) : (
          <Button
            size="sm"
            className="gap-1.5 rounded-full"
            onClick={send}
            disabled={!input.trim()}
          >
            <Sparkles className="size-3.5" /> Ask
          </Button>
        )}
      </div>

      {!hasConversation && !running && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
