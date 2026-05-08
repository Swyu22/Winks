import { memo } from 'react';
import { Zap } from 'lucide-react';

export const Logo = memo(function Logo() {
  return (
    <div className="flex items-center gap-2 group cursor-pointer select-none">
      <div className="size-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.4)] group-hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] transition-[box-shadow] duration-300">
        <Zap aria-hidden="true" className="size-5 text-white fill-white" />
      </div>
      <span className="font-bold text-xl tracking-tight text-gray-800">Winks.闪链</span>
    </div>
  );
});
