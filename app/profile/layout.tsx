import type { ReactNode } from "react";
import styles from "./profile.module.css";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.profileShell}>
      <div className={styles.main}>{children}</div>
    </main>
  );
}
