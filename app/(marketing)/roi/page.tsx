import { PageHero } from "@/components/marketing/page-hero";
import { ROICalculator } from "./roi-calculator";

export default function ROIPage() {
  return (
    <>
      <PageHero
        eyebrow="ROI calculator"
        title="Model the value of staying open."
        description="Plug in your site, throughput, and downtime cost. We'll show the conservative protection value of running OutbreakOS."
      />
      <section className="container py-12">
        <ROICalculator />
      </section>
    </>
  );
}
