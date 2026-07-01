"use client";

import * as React from "react";
import { useActionState } from "react";
import { setupPasscode } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/pin-input";

export function SetupPasscodeForm() {
  const [state, formAction, pending] = useActionState(setupPasscode, undefined);
  const [passcode, setPasscode] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="passcode" className="text-xs text-muted-foreground">
          New passcode
        </Label>
        <PinInput
          id="passcode"
          name="passcode"
          autoFocus
          value={passcode}
          onValueChange={setPasscode}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm" className="text-xs text-muted-foreground">
          Confirm passcode
        </Label>
        <PinInput
          id="confirm"
          name="confirm"
          value={confirm}
          onValueChange={setConfirm}
        />
      </div>
      {state?.error && <p className="text-center text-sm text-destructive">{state.error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={pending || passcode.length !== 6 || confirm.length !== 6}
      >
        {pending ? "Saving…" : "Set passcode & continue"}
      </Button>
    </form>
  );
}
