import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loaderPage}>
      <div className={styles.spinner}>
        <div className={styles.circle}></div>
        <div className={styles.circle}></div>
        <div className={styles.brand}>BEYOND STICH.</div>
      </div>
    </div>
  );
}
