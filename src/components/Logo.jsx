import { memo } from 'react';
import { Zap } from 'lucide-react';

export const Logo = memo(function Logo() {
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="size-8 rounded-full bg-brand flex items-center justify-center shadow-[0_0_10px_rgba(255,208,0,0.4)]">
        <Zap aria-hidden="true" className="size-5 text-white fill-white" />
      </div>
      <span className="font-display font-bold text-xl tracking-tight text-gray-800">Winks.闪链</span>
    </div>
  );
});
