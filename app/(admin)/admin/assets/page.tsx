import { redirect } from "next/navigation";

// Assets now lives as a tab on the Financial page — one page for everything
// about the money, per the client's request to keep this simple.
export default function AdminAssetsRedirect() {
  redirect("/admin/financial?tab=assets");
}
