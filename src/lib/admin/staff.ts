import { adminData, getRoleNames } from "@/lib/admin/sample-admin-data";
import { getCommerceServerContext } from "@/lib/commerce/server-context";
import type { StaffUser } from "@/lib/commerce/types";
import type { Role } from "@/lib/permissions/permissions";

export type AdminStaffSource = "live" | "sample";

export type AdminStaffData = {
  source: AdminStaffSource;
  sourceMessage?: string;
  users: StaffUser[];
  roles: Role[];
};

export async function getAdminStaffData(): Promise<AdminStaffData> {
  const context = getCommerceServerContext();
  if (!context) {
    return sampleStaffData("Firebase Admin is not configured yet. Showing sample staff accounts.");
  }

  try {
    const [users, roles] = await Promise.all([
      context.repo.listStaffUsers(),
      context.repo.listRoles()
    ]);

    return {
      source: "live",
      users,
      roles: roles.length > 0 ? roles : adminData.roles
    };
  } catch {
    return sampleStaffData(
      "Firestore is not ready yet. Showing sample staff accounts until Firebase is enabled."
    );
  }
}

export { getRoleNames };

function sampleStaffData(sourceMessage: string): AdminStaffData {
  return {
    source: "sample",
    sourceMessage,
    users: adminData.users,
    roles: adminData.roles
  };
}
