import Modal from './Modal.jsx';

// Reusable "Are you sure?" dialog
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  busyLabel = 'Please wait...',
  variant = 'danger',
  busy,
  onConfirm,
  onClose,
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} data-autofocus>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? busyLabel : confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-text">{message}</p>
    </Modal>
  );
}

export default ConfirmDialog;