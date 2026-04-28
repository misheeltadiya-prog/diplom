import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="section-label">/login</span>
        <h1>Шинэ login дэлгэц энд нэмэгдэнэ</h1>
        <p className="auth-copy">
          Одоогийн login UI-г салгасан. Шинэ auth flow нэмэхэд энэ route бэлэн байна.
        </p>
        <div className="top-actions">
          <Link className="button button-secondary" href="/">
            Нүүр рүү буцах
          </Link>
        </div>
      </section>
    </main>
  );
}
