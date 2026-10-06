import { describe, expect, it } from "vitest";
import { formMoneyMinorUnit, humanizeActionError, slugFromTitle } from "@/lib/admin/product-form";
import { z, ZodError } from "zod";

describe("admin product form helpers", () => {
  it("converts GHS form amounts to minor units", () => {
    const formData = new FormData();
    formData.set("price", "1,250.50");
    expect(formMoneyMinorUnit(formData, "price")).toBe(125050);
  });

  it("creates URL-safe slugs from product titles", () => {
    expect(slugFromTitle("Oh My Kitty & Daily Care!")).toBe("oh-my-kitty-and-daily-care");
  });
});

describe("slugFromTitle", () => {
  it("tidies what someone actually types into the slug field", () => {
    // The exact value that produced a raw validation dump on the owner's phone.
    expect(slugFromTitle("OMK-daily care")).toBe("omk-daily-care");
  });

  it("builds a slug from a shouty product name", () => {
    expect(slugFromTitle("DRIED CRANBERRY FRUIT")).toBe("dried-cranberry-fruit");
  });

  it("keeps ampersands readable and trims stray separators", () => {
    expect(slugFromTitle("  Best & Biggest!  ")).toBe("best-and-biggest");
  });
});

describe("humanizeActionError", () => {
  function zodErrorFor(value: unknown) {
    try {
      z.object({
        slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase URL-safe slugs.")
      }).parse(value);
    } catch (error) {
      return error;
    }
    throw new Error("expected a ZodError");
  }

  it("replaces the raw issue dump with the readable message", () => {
    const message = humanizeActionError(zodErrorFor({ slug: "OMK-daily care" }));

    expect(message).toBe("Slug: Use lowercase URL-safe slugs.");
    expect(message).not.toContain("invalid_format");
    expect(message).not.toContain("{");
  });

  it("labels a camelCase field the way the form reads", () => {
    const error = (() => {
      try {
        z.object({ lowStockThreshold: z.number() }).parse({ lowStockThreshold: "x" });
      } catch (e) { return e; }
    })();

    expect(humanizeActionError(error)).toContain("Low stock threshold:");
  });

  it("passes an ordinary error through untouched", () => {
    expect(humanizeActionError(new Error("Product not found."))).toBe("Product not found.");
  });

  it("falls back when given something that isn't an error at all", () => {
    expect(humanizeActionError("boom")).toBe("Save failed.");
  });

  it("does not repeat the same complaint twice", () => {
    const error = new ZodError([
      { code: "custom", path: ["slug"], message: "Use lowercase URL-safe slugs." },
      { code: "custom", path: ["slug"], message: "Use lowercase URL-safe slugs." }
    ] as never);

    expect(humanizeActionError(error)).toBe("Slug: Use lowercase URL-safe slugs.");
  });
});
