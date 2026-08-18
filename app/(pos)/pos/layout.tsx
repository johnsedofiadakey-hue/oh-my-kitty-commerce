import { redirect } from "next/navigation";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { canAccessAdmin, canAccessPos, defaultRoles } from "@/lib/permissions/permissions";
import type { CommerceActor } from "@/lib/commerce/operations";
import { RegisterPosServiceWorker } from "@/components/pos/register-pos-service-worker";

export default async function PosLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  let actor: CommerceActor;

  try {
    actor = await getRequiredPosActor();
  } catch {
    redirect("/admin/login");
  }

  if (!canAccessPos(defaultRoles, actor)) {
    if (canAccessAdmin(defaultRoles, actor)) {
      redirect("/admin");
    }

    return (
      <div className="pos-shell">
        <p className="admin-alert" role="status">
          Your account is signed in but doesn&apos;t have POS access yet. Ask an owner to assign
          you a role.
        </p>
      </div>
    );
  }

  return (
    <div className="pos-shell">
      <RegisterPosServiceWorker />
      {children}
    </div>
  );
}
