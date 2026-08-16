import { redirect } from "next/navigation";
import { getRequiredPosActor } from "@/lib/auth/pos-server";

export default async function PosLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await getRequiredPosActor();
  } catch {
    redirect("/admin/login");
  }

  return <div className="pos-shell">{children}</div>;
}
