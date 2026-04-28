import styles from "./index-landing.module.css";

type ToastProps = {
  message: string | null;
};

export function Toast({ message }: ToastProps) {
  if (!message) {
    return null;
  }

  return (
    <div className={styles.toast}>
      <div className={styles.toastDot} />
      <span>{message}</span>
    </div>
  );
}
