'use client';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}
