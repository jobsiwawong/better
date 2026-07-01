import { isPasscodeConfigured } from "@/lib/passcode";
import { LoginForm } from "@/app/login/login-form";
import { SetupPasscodeForm } from "@/app/login/setup-passcode-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const configured = await isPasscodeConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-semibold">
            B
          </div>
          {configured ? (
            <>
              <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Enter your passcode to open Better.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-foreground">Set up Better</h1>
              <p className="text-sm text-muted-foreground">
                Choose a 6-digit passcode to protect your data.
              </p>
            </>
          )}
        </div>
        {configured ? <LoginForm /> : <SetupPasscodeForm />}
      </div>
    </div>
  );
}
