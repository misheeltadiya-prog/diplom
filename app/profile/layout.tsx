import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getUserSubscriptionSummaryForLayout } from "@/lib/user-subscription";
import { ProfileAppShell } from "./profile-app-shell";
import styles from "./profile.module.css";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const subscription = user ? await getUserSubscriptionSummaryForLayout(user.id) : null;

  return (
    <main className={styles.profileShell}>
      <ProfileAppShell
        user={
          user
            ? {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatarUrl: user.avatarUrl ?? null,
                role: user.role,
                createdAt: user.createdAt,
                subscription,
              }
            : null
        }
      >
        {children}
      </ProfileAppShell>
    </main>
  );
}
