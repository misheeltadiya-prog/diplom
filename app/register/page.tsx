import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <span className="section-label">/register</span>
        <h1>Шинэ register дэлгэц энд нэмэгдэнэ</h1>
        <p className="auth-copy">
          Хуучин register UI-г авсан. Дараагийн auth компонент нэмэхэд энэ route-оос шууд үргэлжлүүлж болно.
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
