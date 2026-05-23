import { PageHero } from "@/components/marketing/page-hero";
import { ContactForm } from "./contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plane, Activity, Hospital, Globe2 } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Talk to us"
        title="Demo, pilot, or emergency deployment."
        description="A real human will reply within one business day. For active situations, mark the form as Emergency and we'll route to deployment on-call."
      />

      <section className="container py-12 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request a demo or pilot</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Who we work with
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><Plane className="h-3.5 w-3.5 text-primary" />Airport authorities & ground handlers</p>
              <p className="flex items-center gap-2"><Activity className="h-3.5 w-3.5 text-primary" />Mining, oil & gas, industrial operators</p>
              <p className="flex items-center gap-2"><Hospital className="h-3.5 w-3.5 text-primary" />Hospitals, district health offices, clinics</p>
              <p className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-primary" />Ministries, NGOs, and multilateral agencies</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Emergency deployment</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Active situation? Select <strong>Emergency deployment</strong> in the form. Our deployment lead will reach out within 4 hours.</p>
            </CardContent>
          </Card>
        </aside>
      </section>
    </>
  );
}
