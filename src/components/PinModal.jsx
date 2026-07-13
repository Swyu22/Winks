import { memo, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { ADMIN_PIN } from '../lib/constants.js';
import { ModalDialog } from './ModalDialog.jsx';

export const PinModal = memo(function PinModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  return <PinModalContent onClose={onClose} onSuccess={onSuccess} />;
});

const PinModalContent = ({ onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <ModalDialog
      aria-labelledby="pin-modal-title"
      aria-describedby="pin-modal-description"
      onClose={onClose}
      className="w-[calc(100%-2rem)] max-w-xs backdrop:bg-gray-950/60"
    >
      <div className="w-full bg-white rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <div className="size-10 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3 text-brand-700">
            <Lock aria-hidden="true" className="size-5" />
          </div>
          <h3 id="pin-modal-title" className="font-semibold text-gray-900">安全验证</h3>
          <p id="pin-modal-description" className="text-xs text-gray-500 mt-1">执行此操作需要管理员密码</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            id="admin-pin-input"
            name="admin-pin"
            aria-label="管理员密码"
            type="password"
            inputMode="numeric"
            maxLength={ADMIN_PIN.length}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error}
            aria-describedby={error ? 'admin-pin-error' : undefined}
            placeholder="输入密码…"
            className={`w-full text-center text-2xl tracking-[0.5em] font-bold h-12 rounded-xl bg-gray-50 border-2 outline-none transition-colors ${error ? 'border-red-500 bg-red-50 text-red-700 placeholder-red-700' : 'border-gray-100 focus:border-brand focus:bg-white text-gray-800'}`}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
          />
          <p
            id="admin-pin-error"
            aria-live="polite"
            className={`text-red-700 text-xs text-center mt-2 font-bold ${error ? '' : 'sr-only'}`}
          >
            {error ? '密码错误' : ''}
          </p>
          <button type="submit" className="w-full mt-4 h-10 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-950 transition-colors flex items-center justify-center">
            确认
          </button>
        </form>
        <button
          type="button"
          aria-label="关闭安全验证"
          onClick={onClose}
          className="absolute top-3 right-3 size-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
    </ModalDialog>
  );
};
