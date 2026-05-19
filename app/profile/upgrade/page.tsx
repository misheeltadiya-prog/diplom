import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UpgradeClient } from "./upgrade-client";
import styles from "../profile.module.css";

export default async function ProfileUpgradePage({
  searchParams,
}: {
  searchParams?: Promise<{ checkout?: string; session_id?: string | string[] }>;
}) {
  const sp = (await searchParams) ?? {};
  const rawSid = sp.session_id;
  const checkoutSessionId =
    typeof rawSid === "string" ? rawSid.trim() : Array.isArray(rawSid) ? String(rawSid[0] ?? "").trim() : "";
  const user = await getCurrentUser();
  if (!user) {
    return (
      <section className={styles.sectionCard}>
        <h1 className={styles.sectionTitle}>Нэвтэрч subscription удирдах</h1>
        <Link className={styles.chip} href="/login">
          Нэвтрэх
        </Link>
      </section>
    );
  }
  if (user.role === "client") {
    redirect("/profile");
  }

  return (
    <section className={styles.sectionCard}>
      <UpgradeClient checkoutFlash={sp.checkout} checkoutSessionId={checkoutSessionId || undefined} />
    </section>
  );
}
