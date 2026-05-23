import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 grid-bg">
      <Link href="/" className="flex items-center gap-2 font-bold mb-8">
        <Activity className="h-5 w-5 text-primary" />
        <span>OutbreakOS</span>
      </Link>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">404</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-bold">This route is off the map.</h1>
      <p className="mt-3 text-sm text-muted-foreground max-w-md">
        The page you requested does not exist — or it was a placeholder we promised never to build.
      </p>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Marketing site
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button>Open command center</Button>
        </Link>
      </div>
    </div>
  );
}
