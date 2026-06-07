'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  withLockIcon?: boolean;
  id?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = '••••••••',
  disabled = false,
  withLockIcon = false,
  id,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {withLockIcon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          <Lock size={18} />
        </span>
      )}
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        className={`input-field ${withLockIcon ? 'pl-10' : ''} pr-11`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        disabled={disabled}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
