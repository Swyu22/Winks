import { memo } from 'react';
import { X } from 'lucide-react';
import { ALL_FILTER, APP_VERSION } from '../lib/constants.js';

export const CategorySidebar = memo(function CategorySidebar({
  classifications,
  activeClassification,
  onSelectClassification,
  onDeleteClassification,
}) {
  return (
    <aside aria-label="链接分类" className="hidden lg:block fixed left-0 top-20 bottom-0 w-64 border-r border-gray-100 bg-white z-30">
      <div className="h-full overflow-y-auto px-4 py-6 flex flex-col">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 px-1">分类</h3>

        <div className="space-y-2 flex-1">
          <button
            type="button"
            onClick={() => onSelectClassification(ALL_FILTER)}
            aria-pressed={activeClassification === ALL_FILTER}
            className={`w-full h-10 rounded-lg text-left px-3 text-sm font-bold transition-colors flex items-center ${
              activeClassification === ALL_FILTER
                ? 'bg-brand text-brand-foreground shadow-[0_4px_12px_rgba(255,208,0,0.35)]'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            全部
          </button>

          {classifications.map((classification) => (
            <div key={classification} className="group relative">
              <button
                type="button"
                onClick={() => onSelectClassification(classification)}
                aria-pressed={activeClassification === classification}
                className={`w-full h-10 rounded-lg text-left px-3 pr-11 text-sm font-bold transition-colors flex items-center ${
                  activeClassification === classification
                    ? 'bg-brand text-brand-foreground shadow-[0_4px_12px_rgba(255,208,0,0.35)]'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="min-w-0 truncate">{classification}</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteClassification(classification)}
                aria-label={`删除分类：${classification}`}
                disabled={classifications.length <= 1}
                title={classifications.length <= 1 ? '至少保留一个分类' : `删除分类：${classification}`}
                className={`absolute right-0 top-0 h-10 w-10 rounded-lg border flex items-center justify-center transition-opacity duration-200 opacity-0 pointer-events-none delay-0 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:delay-[3000ms] group-focus-within:opacity-100 group-focus-within:pointer-events-auto group-focus-within:delay-0 ${
                  classifications.length <= 1
                    ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-100 text-gray-500 bg-white hover:border-red-300 hover:text-red-700'
                }`}
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 mt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] tracking-wide text-gray-500">版本 <span className="font-mono">{APP_VERSION}</span></p>
        </div>
      </div>
    </aside>
  );
});

export const MobileCategoryBar = memo(function MobileCategoryBar({
  classifications,
  activeClassification,
  onSelectClassification,
}) {
  return (
    <div className="lg:hidden mb-6">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">分类</p>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => onSelectClassification(ALL_FILTER)}
          aria-pressed={activeClassification === ALL_FILTER}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
            activeClassification === ALL_FILTER
              ? 'bg-brand text-brand-foreground'
              : 'bg-white text-gray-600 border border-gray-100'
          }`}
        >
          全部
        </button>
        {classifications.map((classification) => (
          <button
            key={classification}
            type="button"
            onClick={() => onSelectClassification(classification)}
            aria-pressed={activeClassification === classification}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              activeClassification === classification
                ? 'bg-brand text-brand-foreground'
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            {classification}
          </button>
        ))}
      </div>
    </div>
  );
});
