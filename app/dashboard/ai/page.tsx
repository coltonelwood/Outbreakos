import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotADiagnosticBanner, AIDisclaimer } from "@/components/ui/disclaimer";
import { AICommandClient } from "./ai-client";
import { Brain } from "lucide-react";

export default function AIPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Brain className="h-7 w-7 text-primary" /> AI Command Center
        </h1>
        <p className="text-muted-foreground text-sm">
          Ask questions, generate briefings, draft stakeholder updates and
          resource requests. The AI cites internal data and disclaims that
          outputs require human review.
        </p>
      </div>

      <NotADiagnosticBanner />
      <AIDisclaimer />

      <Card>
        <CardHeader><CardTitle>Ask the command assistant</CardTitle></CardHeader>
        <CardContent>
          <AICommandClient />
        </CardContent>
      </Card>
    </div>
  );
}
