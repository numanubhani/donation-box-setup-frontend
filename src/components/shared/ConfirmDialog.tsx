'use client';

import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center py-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertTriangle className="text-red-500" size={24} />
        </div>
        <p className="text-slate-600 text-sm">{message}</p>
      </div>
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button onClick={onClose} className="btn-secondary flex-1">
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={confirmVariant === 'danger' ? 'btn-danger flex-1' : 'btn-primary flex-1'}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
