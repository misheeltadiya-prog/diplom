import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLeadsPanel } from "./admin-leads-panel";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import styles from "./admin.module.css";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?next=/admin");
  }
  if (user.role !== "admin") {
    redirect("/freelancers");
  }

  let userCount = 0;
  let jobCount = 0;
  let offerCount = 0;
  let leadCount = 0;
  try {
    const db = getDb();
    const [u] = (await db.execute(`SELECT COUNT(*) AS c FROM users`)) as [{ c: number }[], unknown];
    const [j] = (await db.execute(`SELECT COUNT(*) AS c FROM job_posts`)) as [{ c: number }[], unknown];
    userCount = u[0]?.c ?? 0;
    jobCount = j[0]?.c ?? 0;
    try {
      const [o] = (await db.execute(`SELECT COUNT(*) AS c FROM job_offers`)) as [{ c: number }[], unknown];
      offerCount = o[0]?.c ?? 0;
    } catch {
      /* */
    }
    try {
      const [l] = (await db.execute(`SELECT COUNT(*) AS c FROM platform_leads`)) as [{ c: number }[], unknown];
      leadCount = l[0]?.c ?? 0;
    } catch {
      /* */
    }
  } catch {
    /* */
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/">
          C-Work Admin
        </Link>
        <nav className={styles.nav}>
          <Link href="/freelancers">Freelancers</Link>
          <Link href="/companies">Companies</Link>
        </nav>
      </header>
      <main className={styles.main}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Админ самбар</h1>
        <p className={styles.muted}>Товч статистик (MySQL).</p>
        <div className={styles.card}>
          <p>
            Хэрэглэгч: <strong>{userCount}</strong>
          </p>
          <p>
            Ажлын зар: <strong>{jobCount}</strong>
          </p>
          <p>
            Job offers: <strong>{offerCount}</strong>
          </p>
          <p>
            Leads (hire/join): <strong>{leadCount}</strong>
          </p>
        </div>
        <section className={styles.card}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 12 }}>Сүүлийн lead-үүд</h2>
          <AdminLeadsPanel />
        </section>
      </main>
    </div>
  );
}
