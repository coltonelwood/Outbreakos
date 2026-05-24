import { Suspense } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { SetPasswordForm } from "./set-password-form";

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 grid-bg">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-card/80 backdrop-blur p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold mb-6">
            <Activity className="h-5 w-5 text-primary" /> OutbreakOS
          </Link>
          <h1 className="text-2xl font-bold">Set your password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete your invitation to join your team's command center.
          </p>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
