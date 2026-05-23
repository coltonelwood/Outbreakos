import { ScreeningForm } from "./screening-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotADiagnosticBanner } from "@/components/ui/disclaimer";
import { db } from "@/lib/store";
import { currentUser } from "@/lib/auth";

export default function NewScreeningPage() {
  const d = db();
  const user = currentUser();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">New screening</h1>
        <p className="text-muted-foreground text-sm">
          Airport, site-entry, or clinic intake. Outputs an operational risk
          tier and recommended action.
        </p>
      </div>
      <NotADiagnosticBanner />
      <Card>
        <CardHeader>
          <CardTitle>Screening record</CardTitle>
        </CardHeader>
        <CardContent>
          <ScreeningForm sites={d.sites} userId={user?.id ?? "u_demo"} />
        </CardContent>
      </Card>
    </div>
  );
}
