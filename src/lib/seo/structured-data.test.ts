import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/seo/structured-data";

describe("buildOrganizationJsonLd", () => {
  const schema = buildOrganizationJsonLd("0241448231", {
    pickupLocation: "Accra-Madina",
    mapLink: "https://maps.google.com/?q=5.675043,-0.144152"
  }) as unknown as Record<string, unknown>;

  it("declares a local Store, not a generic Organization", () => {
    // The point of the whole change: a verifiable Ghanaian shop reads as a
    // different entity to the US store trading under the same brand name.
    expect(schema["@type"]).toBe("Store");
  });

  it("carries a Ghanaian address", () => {
    expect(schema.address).toMatchObject({
      addressLocality: "Madina",
      addressRegion: "Greater Accra",
      addressCountry: "GH"
    });
  });

  it("pulls real coordinates out of the pickup map link", () => {
    expect(schema.geo).toMatchObject({ latitude: 5.675043, longitude: -0.144152 });
  });

  it("converts the locally-dialled number to international format", () => {
    expect(schema.telephone).toBe("+233241448231");
  });

  it("accepts a number already in international form without doubling it", () => {
    const already = buildOrganizationJsonLd("+233241448231") as Record<string, unknown>;
    expect(already.telephone).toBe("+233241448231");
  });

  it("lists the spellings customers actually type", () => {
    expect(schema.alternateName).toContain("Oh My Kitty Ghana");
  });

  it("still works when no map link is configured", () => {
    const minimal = buildOrganizationJsonLd("0241448231") as Record<string, unknown>;
    expect(minimal.geo).toBeUndefined();
    expect(minimal.address).toBeDefined();
  });
});

describe("buildWebSiteJsonLd", () => {
  it("ties the site to the store record", () => {
    const site = buildWebSiteJsonLd() as unknown as { publisher: { "@id": string } };
    expect(site.publisher["@id"]).toContain("#store");
  });
});
