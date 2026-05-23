import Link from "next/link";
import { Activity } from "lucide-react";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 grid-bg">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card/80 backdrop-blur p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold mb-6">
            <Activity className="h-5 w-5 text-primary" /> OutbreakOS
          </Link>
          <h1 className="text-2xl font-bold">Create your command center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up an organization and your owner account.
          </p>
        </div>
        <SignupForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
