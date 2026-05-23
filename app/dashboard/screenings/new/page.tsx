import { ScreeningForm } from "./screening-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotADiagnosticBanner } from "@/components/ui/disclaimer";
import { data } from "@/lib/store";
import { currentUser, requireSession } from "@/lib/auth";

export default function NewScreeningPage() {
  const sess = requireSession();
  const sites = data.sites(sess.orgId);
  const user = currentUser();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">New screening</h1>
        <p className="text-muted-foreground text-sm">
          Airport, site-entry, or clinic intake. Outputs an operational risk
          tier and recommended workflow action — not a clinical diagnosis.
        </p>
      </div>
      <NotADiagnosticBanner />
      <Card>
        <CardHeader>
          <CardTitle>Screening record</CardTitle>
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add at least one site in <a href="/dashboard/sites" className="text-primary hover:underline">Sites</a> before recording screenings.
            </p>
          ) : (
            <ScreeningForm sites={sites} userId={user?.id ?? "u_demo"} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
