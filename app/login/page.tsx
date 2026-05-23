import Link from "next/link";
import { Activity } from "lucide-react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 grid-bg" aria-hidden />
        <div className="absolute inset-0 gradient-mesh" aria-hidden />
        <div className="relative p-16 flex flex-col justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Activity className="h-6 w-6 text-primary" />
            <span>OutbreakOS</span>
          </Link>
          <div className="space-y-4 max-w-md">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">
              Command Center
            </p>
            <h2 className="text-3xl font-bold leading-tight">
              "We replaced 12 spreadsheets with one platform — and shipped our first
              SITREP in 90 seconds."
            </h2>
            <p className="text-sm text-muted-foreground">
              — Demo testimonial, OutbreakOS deployment lead
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            OutbreakOS is an operational platform, not a medical diagnostic device.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <Link href="/" className="lg:hidden inline-flex items-center gap-2 font-bold mb-6">
              <Activity className="h-5 w-5 text-primary" /> OutbreakOS
            </Link>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your command center.
            </p>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Get started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
