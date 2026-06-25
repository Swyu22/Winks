import { memo, useEffect, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { ADMIN_PIN } from '../lib/constants.js';

export const PinModal = memo(function PinModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 relative zoom-in-95 duration-200">
        <button
          type="button"
          aria-label="关闭安全验证"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
        <div className="text-center mb-6">
          <div className="size-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-600">
            <Lock aria-hidden="true" className="size-5" />
          </div>
          <h3 id="pin-modal-title" className="font-semibold text-gray-900">安全验证</h3>
          <p className="text-xs text-gray-500 mt-1">执行此操作需要管理员密码</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            id="admin-pin-input"
            name="admin-pin"
            autoFocus
            aria-label="管理员密码"
            type="password"
            inputMode="numeric"
            maxLength={ADMIN_PIN.length}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error}
            aria-describedby={error ? 'admin-pin-error' : undefined}
            placeholder="输入密码…"
            className={`w-full text-center text-2xl tracking-[0.5em] font-bold h-12 rounded-xl bg-gray-50 border-2 outline-none transition-colors ${error ? 'border-red-400 bg-red-50 text-red-500 placeholder-red-300' : 'border-gray-100 focus:border-yellow-400 focus:bg-white text-gray-800'}`}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
          />
          <p
            id="admin-pin-error"
            aria-live="polite"
            className={`text-red-500 text-xs text-center mt-2 font-bold ${error ? '' : 'sr-only'}`}
          >
            {error ? '密码错误' : ''}
          </p>
          <button type="submit" className="w-full mt-4 h-10 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-gray-950 transition-colors">
            确认
          </button>
        </form>
      </div>
    </div>
  );
});
