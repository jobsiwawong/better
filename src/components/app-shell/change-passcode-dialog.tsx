"use client";

import * as React from "react";
import { useActionState } from "react";
import { Settings } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/pin-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { changePasscode, type FormState } from "@/app/actions/auth";

export function ChangePasscodeDialog() {
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(changePasscode, undefined);
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [lastHandled, setLastHandled] = React.useState<FormState>(state);
  const [successTick, setSuccessTick] = React.useState(0);

  if (state !== lastHandled) {
    setLastHandled(state);
    if (state?.success) {
      setOpen(false);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccessTick((c) => c + 1);
    }
  }

  React.useEffect(() => {
    if (successTick > 0) toast.success("Passcode updated");
  }, [successTick]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Change passcode"
            onClick={() => setOpen(true)}
          >
            <Settings className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Change passcode</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Change passcode</DialogTitle>
          <DialogDescription>
            Enter your current passcode and choose a new 6-digit one.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current" className="text-xs text-muted-foreground">
              Current passcode
            </Label>
            <PinInput
              id="current"
              name="current"
              autoFocus
              value={current}
              onValueChange={setCurrent}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="next" className="text-xs text-muted-foreground">
              New passcode
            </Label>
            <PinInput id="next" name="next" value={next} onValueChange={setNext} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-xs text-muted-foreground">
              Confirm new passcode
            </Label>
            <PinInput
              id="confirm"
              name="confirm"
              value={confirm}
              onValueChange={setConfirm}
            />
          </div>
          {state?.error && (
            <p className="text-center text-sm text-destructive">{state.error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={
              pending ||
              current.length !== 6 ||
              next.length !== 6 ||
              confirm.length !== 6
            }
          >
            {pending ? "Saving…" : "Update passcode"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
