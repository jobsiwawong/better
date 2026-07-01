"use client";

import * as React from "react";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PinInput } from "@/components/pin-input";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [passcode, setPasscode] = React.useState("");

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="passcode" className="sr-only">
          Passcode
        </Label>
        <PinInput
          id="passcode"
          name="passcode"
          autoFocus
          value={passcode}
          onValueChange={setPasscode}
        />
      </div>
      {state?.error && <p className="text-center text-sm text-destructive">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending || passcode.length !== 6}>
        {pending ? "Checking…" : "Enter"}
      </Button>
    </form>
  );
}
