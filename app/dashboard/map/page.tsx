import { data } from "@/lib/store";
import { requireSession } from "@/lib/auth";
import { MapClient } from "./map-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MapPage() {
  const sess = requireSession();
  const regions = data.regions(sess.orgId);
  const sites = data.sites(sess.orgId);
  const cases = data.cases(sess.orgId);
  const contacts = data.contacts(sess.orgId);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Outbreak Map</h1>
        <p className="text-muted-foreground text-sm">
          Affected regions, case clusters, points of entry, and sites — filterable in real time.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Operational picture</CardTitle>
        </CardHeader>
        <CardContent>
          {regions.length === 0 && sites.length === 0 ? (
            <div className="h-[560px] rounded-md bg-card flex items-center justify-center text-sm text-muted-foreground text-center px-6">
              Add sites or surveillance regions to populate the map.
            </div>
          ) : (
            <MapClient regions={regions} sites={sites} cases={cases} contacts={contacts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
