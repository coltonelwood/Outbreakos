import { db } from "@/lib/store";
import { MapClient } from "./map-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MapPage() {
  const d = db();
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
          <MapClient regions={d.regions} sites={d.sites} cases={d.cases} contacts={d.contacts} />
        </CardContent>
      </Card>
    </div>
  );
}
