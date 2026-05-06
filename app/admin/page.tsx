import Link from "next/link";
import { redirect } from "next/navigation";
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
  try {
    const db = getDb();
    const [u] = (await db.execute(`SELECT COUNT(*) AS c FROM users`)) as [{ c: number }[], unknown];
    const [j] = (await db.execute(`SELECT COUNT(*) AS c FROM job_posts`)) as [{ c: number }[], unknown];
    userCount = u[0]?.c ?? 0;
    jobCount = j[0]?.c ?? 0;
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
        </nav>
      </header>
      <main className={styles.main}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Админ самбар</h1>
        <p className={styles.muted}>Товч статистик (холбогдсон MySQL database).</p>
        <div className={styles.card}>
          <p>
            Хэрэглэгч: <strong>{userCount}</strong>
          </p>
          <p>
            Ажлын зар: <strong>{jobCount}</strong>
          </p>
        </div>
      </main>
    </div>
  );
}
