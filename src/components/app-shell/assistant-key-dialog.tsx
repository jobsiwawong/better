"use client";

import * as React from "react";
import { Sparkles, ExternalLink, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getApiKeyStatus, saveApiKey } from "@/app/actions/settings";

export function AssistantKeyDialog() {
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<{ configured: boolean; source: string | null } | null>(
    null
  );

  // Refresh the "already set" status each time the dialog opens.
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setKey("");
      setStatus(null);
      getApiKeyStatus().then(setStatus);
    }
  };

  const save = async () => {
    setSaving(true);
    const res = await saveApiKey(key);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(key.trim() ? "AI assistant is ready to go ✨" : "API key removed");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="AI assistant settings"
            onClick={() => handleOpenChange(true)}
          >
            <Sparkles className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>AI assistant key</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> AI assistant
          </DialogTitle>
          <DialogDescription>
            The &ldquo;Ask Better&rdquo; assistant needs an Anthropic API key to work.
            Paste yours below — it&apos;s stored privately on this device and never leaves it.
          </DialogDescription>
        </DialogHeader>

        {status?.configured && (
          <p className="flex items-center gap-1.5 rounded-lg bg-[#3f8f5c]/12 px-3 py-2 text-sm text-[#3f8f5c]">
            <Check className="size-4" /> A key is already set
            {status.source === "env" ? " (from your .env file)" : ""}. You can replace it below.
          </p>
        )}

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="anthropic-key" className="text-xs text-muted-foreground">
              Anthropic API key
            </Label>
            <Input
              id="anthropic-key"
              type="password"
              autoComplete="off"
              placeholder="sk-ant-api03-…"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && key.trim()) save();
              }}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1.5 font-medium text-foreground">Don&apos;t have a key yet?</p>
            <ol className="ml-4 list-decimal space-y-1">
              <li>
                Open{" "}
                <a
                  href="https://platform.claude.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                >
                  platform.claude.com <ExternalLink className="size-3" />
                </a>{" "}
                and sign in.
              </li>
              <li>Add a payment method under Billing (pay-as-you-go; a few dollars lasts a long time).</li>
              <li>Go to API keys → Create Key, copy it, and paste it here.</li>
            </ol>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || !key.trim()}>
              {saving ? "Saving…" : "Save key"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
