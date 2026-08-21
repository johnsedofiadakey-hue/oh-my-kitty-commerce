import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getRequiredPosActor } from "@/lib/auth/pos-server";
import { canAccessAdmin, canAccessPos } from "@/lib/permissions/permissions";
import { getEffectiveRoles, type CommerceActor } from "@/lib/commerce/operations";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import { RegisterPosServiceWorker } from "@/components/pos/register-pos-service-worker";

export const metadata: Metadata = {
  robots: { index: false, follow: false }
};

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

  const context = getCommerceServerContext();
  const roles = context ? await getEffectiveRoles(context, actor.roleIds) : [];

  if (!canAccessPos(roles, actor)) {
    if (canAccessAdmin(roles, actor)) {
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
