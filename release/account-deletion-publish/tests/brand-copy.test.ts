import assert from "node:assert/strict";
import test from "node:test";
import { BRAND_COPY, marketplaceHeadline } from "../mobile/src/lib/brand-copy.ts";

test("old banner headlines normalize punctuation, spacing and line breaks in both clients", () => {
  for (const language of ["fr", "en"] as const) {
    for (const headline of ["SPORT.TECH.\nSTYLE.", "Sport. Tech. Style.", "Sport.Tech.Style", "MOVE MORE.\nLIVE BETTER.", "Votre vie. Vos envies.", "", null]) {
      assert.equal(marketplaceHeadline(headline, language), BRAND_COPY[language].tagline);
    }
    assert.equal(marketplaceHeadline("Sport : nouvelle collection", language), "Sport : nouvelle collection");
  }
});
