import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface Step {
  done: boolean;
  label: string;
  href: string;
  cta: string;
}

export function OnboardingChecklist({ steps }: { steps: Step[] }) {
  const completed = steps.filter((s) => s.done).length;
  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Get OutbreakOS ready for your team</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completed} / {steps.length} complete
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {steps.map((s) => (
            <li
              key={s.label}
              className="flex items-center gap-3 rounded-md border border-border bg-card/60 p-3"
            >
              {s.done ? (
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))] shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={s.done ? "text-muted-foreground line-through" : "font-medium"}>
                {s.label}
              </span>
              {!s.done && (
                <Link
                  href={s.href}
                  className="ml-auto text-sm text-primary inline-flex items-center gap-1 hover:underline"
                >
                  {s.cta} <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
