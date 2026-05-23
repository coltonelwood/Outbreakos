import { NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { Fragment, createElement as h } from "react";
import { data } from "@/lib/store";
import { authErrorResponse, requireCapability } from "@/lib/auth";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#0b1220" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2pt solid #0ea5e9",
    paddingBottom: 12,
    marginBottom: 16,
  },
  orgName: { fontSize: 9, color: "#0ea5e9", textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 18, fontWeight: 700, marginTop: 2 },
  meta: { fontSize: 9, color: "#4b5563", marginTop: 4 },
  brandBadge: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontSize: 14, color: "white", fontWeight: 700 },
  disclaimer: {
    border: "1pt solid #f59e0b",
    backgroundColor: "#fffbeb",
    padding: 8,
    marginBottom: 16,
    fontSize: 9,
    color: "#92400e",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0ea5e9",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 6,
  },
  body: { fontSize: 10, lineHeight: 1.5, marginBottom: 8 },
  kgrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, marginBottom: 8 },
  kbox: {
    width: "33.33%",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  kboxInner: {
    border: "1pt solid #e5e7eb",
    borderRadius: 4,
    padding: 8,
  },
  kLabel: { fontSize: 8, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  kValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  kDelta: { fontSize: 8, color: "#6b7280", marginTop: 2 },
  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 12, fontSize: 10 },
  bulletText: { flex: 1, fontSize: 10 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: "1pt solid #e5e7eb",
    paddingTop: 6,
    fontSize: 8,
    color: "#6b7280",
    textAlign: "center",
  },
});

export async function GET(_: Request, { params }: { params: { id: string } }) {
  let sess;
  try {
    sess = requireCapability("report.read");
  } catch (e) {
    return authErrorResponse(e);
  }
  const report = data.reports(sess.orgId).find((r) => r.id === params.id);
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const org = data.org(sess.orgId)!;

  const tree = h(
    Document,
    { title: report.title, author: "OutbreakOS" },
    h(
      Page as never,
      { size: "A4", style: styles.page },
      h(
        View,
        { style: styles.header },
        h(
          View,
          null,
          h(Text, { style: styles.orgName }, org.name),
          h(Text, { style: styles.title }, report.title),
          h(
            Text,
            { style: styles.meta },
            `Generated ${new Date(report.generatedAt).toISOString().replace("T", " ").slice(0, 16)} · ${report.aiAssisted ? "AI-assisted" : "Template-built"}`,
          ),
        ),
        h(
          View,
          {
            style: { ...styles.brandBadge, backgroundColor: org.branding.primary },
          },
          h(Text, { style: styles.brandText }, org.branding.logoText.slice(0, 2).toUpperCase()),
        ),
      ),

      h(
        Text,
        { style: styles.disclaimer },
        "Operational workflow output. NOT a medical diagnosis. Clinical decisions are made by qualified health authorities. Human review required.",
      ),

      h(Text, { style: styles.sectionTitle }, "Executive summary"),
      h(Text, { style: styles.body }, report.summary),

      h(Text, { style: styles.sectionTitle }, "Key numbers"),
      h(
        View,
        { style: styles.kgrid },
        ...report.keyNumbers.map((k, i) =>
          h(
            View,
            { key: i, style: styles.kbox },
            h(
              View,
              { style: styles.kboxInner },
              h(Text, { style: styles.kLabel }, k.label),
              h(Text, { style: styles.kValue }, k.value),
              k.delta ? h(Text, { style: styles.kDelta }, k.delta) : null,
            ),
          ),
        ),
      ),

      h(Text, { style: styles.sectionTitle }, "Hotspots"),
      ...(report.hotspots.length
        ? report.hotspots.map((s, i) =>
            h(
              View,
              { key: i, style: styles.bullet },
              h(Text, { style: styles.bulletDot }, "•"),
              h(Text, { style: styles.bulletText }, s),
            ),
          )
        : [h(Text, { style: styles.body }, "No hotspots flagged.")]),

      h(Text, { style: styles.sectionTitle }, "Open risks"),
      ...(report.openRisks.length
        ? report.openRisks.map((s, i) =>
            h(
              View,
              { key: i, style: styles.bullet },
              h(Text, { style: styles.bulletDot }, "•"),
              h(Text, { style: styles.bulletText }, s),
            ),
          )
        : [h(Text, { style: styles.body }, "No high-severity risks open.")]),

      h(Text, { style: styles.sectionTitle }, "Recommended actions"),
      ...report.recommended.map((s, i) =>
        h(
          View,
          { key: i, style: styles.bullet },
          h(Text, { style: styles.bulletDot }, `${i + 1}.`),
          h(Text, { style: styles.bulletText }, s),
        ),
      ),

      h(Text, { style: styles.sectionTitle }, "Changes since last window"),
      ...report.changesSinceLast.map((s, i) =>
        h(
          View,
          { key: i, style: styles.bullet },
          h(Text, { style: styles.bulletDot }, "•"),
          h(Text, { style: styles.bulletText }, s),
        ),
      ),

      h(
        Text,
        { style: styles.footer, fixed: true },
        `OutbreakOS · ${org.name} · operational output, not a clinical diagnosis · human review required`,
      ),
    ),
  );

  // renderToBuffer requires a real React element; cast to satisfy TS.
  const buf = await renderToBuffer(tree as never);
  return new NextResponse(buf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.id}.pdf"`,
    },
  });
}

// Keep TS happy about the unused import (the JSX runtime doesn't use Fragment).
const _ignore = Fragment;
void _ignore;
