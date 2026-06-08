import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseLawContent } from "../scripts/lib/parser.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Real Justel page for loi 1994009284 (amends loi 8 avril 1965). 37 articles.
const html = readFileSync(join(__dirname, "fixtures/justel-1994009284.html"), "latin1");

describe("parseLawContent — Justel <a name='Art.N'> anchor segmentation", () => {
  const law = parseLawContent(html, "1994009284");

  it("segments on the real article anchors, not inline cross-references", () => {
    // The document has exactly 37 articles. The bug split it into 143 provisions
    // because the single-quote anchor regex never matched JSDOM's double-quoted
    // serialization, forcing the over-splitting fallback parser.
    expect(law.provisions.length).toBe(37);
  });

  it("captures the full article 1 body (not truncated at \"A l'\")", () => {
    const art1 = law.provisions.find((p) => p.provision_ref === "art1");
    expect(art1).toBeDefined();
    // The bug produced "Article 1. A l'" (15 chars). The real body is long and
    // contains the cross-reference text inline.
    expect(art1!.content.length).toBeGreaterThan(200);
    expect(art1!.content).toContain("article 36bis de la loi du 8 avril 1965");
    expect(art1!.content).toContain("modifications suivantes");
  });

  it("does not emit phantom lowercase 'article N' continuation fragments", () => {
    // Real article bodies start with uppercase "Article N." — a body starting
    // with LOWERCASE "article N" is a mid-sentence cross-reference fragment that
    // the over-split produced. Case-sensitive on purpose.
    const phantom = law.provisions.filter((p) => /^article\s+\d/.test(p.content.trim()));
    expect(phantom).toHaveLength(0);
  });

  it("emits each article ref exactly once (no duplicate refs from over-splitting)", () => {
    const refs = law.provisions.map((p) => p.provision_ref);
    expect(new Set(refs).size).toBe(refs.length);
  });
});

describe("parseLawContent — fallback parser (no anchors) does not over-split", () => {
  // A document with NO <a name="Art.N"> anchors → the fallback path. Its bodies
  // contain inline lowercase cross-references ("l'article 5") that must NOT
  // start a new provision.
  const noAnchorHtml = `<div id="list-title-3">
Article 1. Le présent décret règle une matière visée à l'article 5 de la Constitution.
Article 2. Il modifie l'article 12 et l'article 30 de la loi précédente.
</div>`;

  it("splits only on real article starts, not inline cross-references", () => {
    const law = parseLawContent(noAnchorHtml, "test");
    expect(law.provisions.map((p) => p.provision_ref)).toEqual(["art1", "art2"]);
    expect(law.provisions[0].content).toContain("l'article 5 de la Constitution");
    expect(law.provisions[1].content).toContain("l'article 12 et l'article 30");
  });
});
