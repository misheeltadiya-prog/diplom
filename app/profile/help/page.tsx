import styles from "../profile.module.css";

const steps = [
  {
    title: "1. Бүртгэл эсвэл нэвтрэлт хийх",
    copy: "Эхлээд profile menu-гээс нэвтрэх эсвэл бүртгүүлэх хэсгийг сонгоод өөрийн нэр, имэйл, утасны мэдээллээ оруулна.",
  },
  {
    title: "2. Профайлаа бүрэн бөглөх",
    copy: "Тохиргоо хэсэг рүү орж нэр, имэйл, утасны дугаар болон бусад үндсэн мэдээллээ шинэчилж profile-аа цэгцлээрэй.",
  },
  {
    title: "3. Find Job хэсгээр ажлууд шүүх",
    copy: "Ажлын жагсаалтаас category, байршил, ажлын төрөл зэргээр шүүж өөрт тохирох боломжуудыг хурдан олоорой.",
  },
  {
    title: "4. CV болон profile-оо ашиглаж өргөдөл гаргах",
    copy: "Таалагдсан ажлаа хадгалаад, дараа нь CV-тайгаа нийцэж байгаа эсэхийг шалгаад application илгээнэ.",
  },
  {
    title: "5. Saved jobs ба dashboard-аа тогтмол шалгах",
    copy: "Хадгалсан ажлууд, санал болгож буй ажлууд, profile completeness зэрэг нь dashboard дээр нэг дор харагдана.",
  },
  {
    title: "6. Тусламж хэрэгтэй үед Help and Support ашиглах",
    copy: "Хэрхэн ашиглах, ямар дарааллаар ажиллах, profile-аа яаж сайжруулах талаар энэ хэсгээс алхам алхмаар хараарай.",
  },
];

const faqs = [
  {
    title: "Хэрхэн profile-оо илүү хүчтэй болгох вэ?",
    copy: "Нэр, имэйл, утсаа шинэчилж, CV бүрдэлтээ 80%+ хүргэвэл санал болгох ажлууд илүү оновчтой болно.",
  },
  {
    title: "Saved jobs юунд хэрэгтэй вэ?",
    copy: "Яг одоо биш ч дараа эргэж харах ажлуудаа хадгалж, дараа нь нэг дороос дахин шалгах боломжтой.",
  },
  {
    title: "Settings дээр юу өөрчилж болох вэ?",
    copy: "Одоогоор нэр, имэйл, утасны дугаараа шинэчилж хадгалах боломжтой болгосон.",
  },
];

export default function ProfileHelpPage() {
  return (
    <>
      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Алхам алхмаар заавар</h2>
          </div>
          <span className={styles.chip}>6 steps</span>
        </div>

        <div className={styles.helpGrid}>
          {steps.map((step, index) => (
            <article className={styles.helpStep} key={step.title}>
              <span className={styles.helpStepNumber}>{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.sectionCard}>
        <div className={styles.sectionHead}>
          <div>
            <h2 className={styles.sectionTitle}>Түгээмэл асуултууд</h2>
          </div>
        </div>

        <div className={styles.faqGrid}>
          {faqs.map((faq) => (
            <article className={styles.faqCard} key={faq.title}>
              <h3>{faq.title}</h3>
              <p>{faq.copy}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
