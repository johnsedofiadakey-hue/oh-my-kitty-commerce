import { redirect } from "next/navigation";

// Expenses now lives as a tab on the Financial page — one page for
// everything about the money, per the client's request to keep this simple.
export default function AdminExpensesRedirect() {
  redirect("/admin/financial?tab=expenses");
}
