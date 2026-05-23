// Pure unit tests for the operational risk scoring engine.
// Run with: node --test --experimental-strip-types tests/risk.test.ts
// (Node >= 22). Or: npx tsx --test tests/*.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreScreening } from "../lib/risk.ts";

const noSymptoms = {
  fever: false,
  vomitingDiarrhea: false,
  unexplainedBleeding: false,
  fatigue: false,
  headache: false,
};

test("baseline cleared traveler scores low", () => {
  const r = scoreScreening({
    symptoms: noSymptoms,
    contactWithCase: false,
    travelHistory: ["Nairobi"],
    hcwExposure: false,
    funeralExposure: false,
    originRegion: "Nairobi",
  });
  assert.equal(r.tier, "low");
  assert.equal(r.score, 0);
});

test("fever + funeral exposure escalates to monitor or higher", () => {
  const r = scoreScreening({
    symptoms: { ...noSymptoms, fever: true },
    contactWithCase: false,
    travelHistory: [],
    hcwExposure: false,
    funeralExposure: true,
    originRegion: "Kampala",
  });
  // 25 (fever) + 20 (funeral) = 45 -> elevated
  assert.equal(r.tier, "elevated");
});

test("bleeding alone is urgent (40) below threshold (70) so elevated", () => {
  const r = scoreScreening({
    symptoms: { ...noSymptoms, unexplainedBleeding: true },
    contactWithCase: false,
    travelHistory: [],
    hcwExposure: false,
    funeralExposure: false,
    originRegion: "",
  });
  assert.equal(r.score, 40);
  assert.equal(r.tier, "elevated");
});

test("full-symptom + contact + funeral + hcw + active region = urgent", () => {
  const r = scoreScreening({
    symptoms: {
      fever: true,
      vomitingDiarrhea: true,
      unexplainedBleeding: true,
      fatigue: true,
      headache: true,
    },
    contactWithCase: true,
    travelHistory: ["Bundibugyo"],
    hcwExposure: true,
    funeralExposure: false,
    originRegion: "Bundibugyo",
  });
  assert.equal(r.tier, "urgent");
  assert.ok(r.score >= 70);
});

test("travel through active region credited; origin not double-credited", () => {
  const r = scoreScreening({
    symptoms: noSymptoms,
    contactWithCase: false,
    travelHistory: ["Bundibugyo"],
    hcwExposure: false,
    funeralExposure: false,
    originRegion: "Bundibugyo",
  });
  // travel +20 only, NOT travel +20 AND origin +15
  assert.equal(r.score, 20);
});

test("rationale lists each contributing factor", () => {
  const r = scoreScreening({
    symptoms: { ...noSymptoms, fever: true },
    contactWithCase: true,
    travelHistory: [],
    hcwExposure: false,
    funeralExposure: false,
    originRegion: "",
  });
  assert.ok(r.rationale.some((x) => x.includes("fever")));
  assert.ok(r.rationale.some((x) => x.includes("Contact")));
});

test("custom weights are respected", () => {
  const r = scoreScreening(
    {
      symptoms: { ...noSymptoms, fever: true },
      contactWithCase: false,
      travelHistory: [],
      hcwExposure: false,
      funeralExposure: false,
      originRegion: "",
    },
    { fever: 50, bleeding: 40, contact: 30, travel: 20, hcw: 15, funeral: 20 },
  );
  assert.equal(r.score, 50);
});
