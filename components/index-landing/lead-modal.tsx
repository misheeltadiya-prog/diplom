import styles from "./index-landing.module.css";

type LeadModalProps = {
  mode: "hire" | "join" | null;
  submitted: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export function LeadModal({ mode, submitted, onClose, onSubmit }: LeadModalProps) {
  if (!mode) {
    return null;
  }

  const isJoin = mode === "join";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        {submitted ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successTitle}>Амжилттай илгээгдлээ!</div>
            <div className={styles.successSub}>
              Таны мэдээлэл хүлээн авлаа. Ажлын өдрүүдэд 24 цагийн дотор холбогдоно.
            </div>
            <button className={styles.primaryButton} type="button" onClick={onClose}>
              Хаах
            </button>
          </div>
        ) : (
          <>
            <div className={styles.modalHeader}>
              <div>
                <div className={styles.modalTitle}>{isJoin ? "Freelancer болох" : "Захиалга өгөх"}</div>
                <div className={styles.modalSub}>
                  {isJoin
                    ? "Профайлаа бүртгүүлж ажил эхлэцгээе"
                    : "Мэдээллээ бөглөнө үү, бид тантай холбогдоно"}
                </div>
              </div>
              <button className={styles.closeButton} type="button" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Нэр</label>
                <input className={styles.formInput} placeholder="Таны нэр" />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Утас</label>
                  <input className={styles.formInput} placeholder="99001234" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>И-мэйл</label>
                  <input className={styles.formInput} placeholder="ta@example.mn" />
                </div>
              </div>

              {!isJoin ? (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Ажлын төрөл</label>
                  <select className={styles.formInput} defaultValue="Вэб хөгжүүлэлт">
                    <option>Вэб хөгжүүлэлт</option>
                    <option>UI/UX Дизайн</option>
                    <option>Мобайл апп</option>
                    <option>Контент бичих</option>
                    <option>Маркетинг & SEO</option>
                    <option>Өгөгдлийн шинжилгээ</option>
                    <option>Бусад</option>
                  </select>
                </div>
              ) : null}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>{isJoin ? "Чадвар & Туршлага" : "Ажлын тайлбар"}</label>
                <textarea
                  className={styles.formInput}
                  rows={5}
                  placeholder={isJoin ? "Та ямар ажил хийж чадах вэ..." : "Хэрэгтэй зүйлээ дэлгэрэнгүй тайлбарлана уу..."}
                />
              </div>

              {!isJoin ? (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Төсөв (₮)</label>
                    <input className={styles.formInput} placeholder="500,000" />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Хугацаа</label>
                    <select className={styles.formInput} defaultValue="1 долоо хоног">
                      <option>1 долоо хоног</option>
                      <option>2 долоо хоног</option>
                      <option>1 сар</option>
                      <option>1 сараас дээш</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.ghostButton} type="button" onClick={onClose}>
                Болих
              </button>
              <button className={styles.primaryButton} type="button" onClick={onSubmit}>
                Илгээх →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
