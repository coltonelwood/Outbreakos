import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskPill } from "@/components/ui/status-pill";
import { NotADiagnosticBanner } from "@/components/ui/disclaimer";
import { PrintButton } from "@/components/app/print-button";
import { data } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default async function ScreeningDetail({ params }: { params: { id: string } }) {
  const sess = requireSession();
  const s = (await data.screenings(sess.orgId)).find((x) => x.id === params.id);
  if (!s) notFound();
  const site = (await data.sites(sess.orgId)).find((x) => x.id === s.siteId);

  return (
    <div className="space-y-4 print-page">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link href="/dashboard/screenings" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to screenings
        </Link>
        <PrintButton />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Screening record</h1>
          <p className="text-muted-foreground text-sm">
            <code className="text-primary">{s.id}</code> · {formatDateTime(s.createdAt)}
          </p>
        </div>
        <RiskPill risk={s.risk} />
      </div>

      <NotADiagnosticBanner />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Subject</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Name / ID" value={s.subjectName} />
            <Row label="Anonymous" value={s.anonymous ? "Yes" : "No"} />
            <Row label="Age range" value={s.ageRange} />
            <Row label="Origin" value={`${s.originRegion}, ${s.originCountry}`} />
            <Row label="Destination" value={s.destination || "—"} />
            <Row label="Travel history (21d)" value={s.travelHistory.join(", ") || "—"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Encounter</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Context" value={s.context.replace("_", " ")} />
            <Row label="Site" value={site?.name || s.siteId} />
            <Row label="Created by" value={s.createdBy} />
            <Row label="Created at" value={formatDateTime(s.createdAt)} />
            <Row label="Notes" value={s.notes || "—"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Exposures</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Contact with case" value={s.contactWithCase ? "Yes" : "No"} />
            <Row label="Healthcare worker exposure" value={s.hcwExposure ? "Yes" : "No"} />
            <Row label="Funeral / burial exposure" value={s.funeralExposure ? "Yes" : "No"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reported symptoms</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <Row label="Fever" value={s.symptoms.fever ? "Yes" : "No"} />
            <Row label="Vomiting / diarrhea" value={s.symptoms.vomitingDiarrhea ? "Yes" : "No"} />
            <Row label="Unexplained bleeding" value={s.symptoms.unexplainedBleeding ? "Yes" : "No"} />
            <Row label="Fatigue" value={s.symptoms.fatigue ? "Yes" : "No"} />
            <Row label="Headache" value={s.symptoms.headache ? "Yes" : "No"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Operational decision</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">{s.action}</p>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Rationale (explainable)
            </p>
            <ul className="text-sm space-y-1">
              {s.rationale.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
