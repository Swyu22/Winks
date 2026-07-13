import { useEffect, useRef } from 'react';

export const ModalDialog = ({ children, className = '', onClose, ...props }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    if (!dialog?.open) dialog?.showModal();

    return () => {
      if (dialog?.open) dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`m-auto max-h-[calc(100vh-2rem)] overflow-y-auto overscroll-contain border-0 bg-transparent p-0 shadow-none backdrop:backdrop-blur-sm ${className}`}
      {...props}
    >
      {children}
    </dialog>
  );
};
