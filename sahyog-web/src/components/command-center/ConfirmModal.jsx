import styles from './CommandCenter.module.css';

export function ConfirmModal({ open, title, text, onConfirm, onCancel, loading = false }) {
  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>{title}</h3>
        <p className={styles.modalText}>{text}</p>
        <div className={styles.modalActions}>
          <button className={styles.button} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
