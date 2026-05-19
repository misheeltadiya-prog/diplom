"use client";

import { useEffect, useState } from "react";
import styles from "./admin.module.css";

type Lead = {
  id: number;
  kind: string;
  fullName: string;
  phone: string;
  email: string;
  jobType: string;
  message: string;
  status: string;
  createdAt: string;
};

export function AdminLeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((d: { ok?: boolean; leads?: Lead[]; error?: string }) => {
        if (!d.ok) {
          setError(d.error ?? "Lead ачаалахад алдаа.");
          return;
        }
        setLeads(d.leads ?? []);
      })
      .catch(() => setError("Сүлжээний алдаа."));
  }, []);

  if (error) {
    return <p className={styles.muted}>{error}</p>;
  }

  if (leads.length === 0) {
    return <p className={styles.muted}>Lead байхгүй.</p>;
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Төрөл</th>
            <th>Нэр</th>
            <th>И-мэйл</th>
            <th>Утас</th>
            <th>Тайлбар</th>
            <th>Огноо</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id}>
              <td>{l.id}</td>
              <td>{l.kind}</td>
              <td>{l.fullName}</td>
              <td>{l.email}</td>
              <td>{l.phone}</td>
              <td>{l.message.slice(0, 80)}</td>
              <td>{new Date(l.createdAt).toLocaleString("mn-MN")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
