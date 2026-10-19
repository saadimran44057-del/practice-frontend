import { useEffect, useRef } from 'react';
import { IconClose } from './Icons.jsx';

// Shared frame for every modal (product, profile, delete)
function Modal({ title, description, onClose, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    // Close on Escape
    const handleKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', handleKey);

    // Stop the page behind the modal from scrolling
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Put the cursor in the first field
    const first = dialogRef.current?.querySelector(
      'input:not([type="file"]):not([disabled]), textarea, [data-autofocus]'
    );
    first?.focus();

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeRef.current();
      }}
    >
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
      >
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;