import { describe, expect, it } from "vitest";
import { formMoneyMinorUnit, slugFromTitle } from "@/lib/admin/product-form";

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
