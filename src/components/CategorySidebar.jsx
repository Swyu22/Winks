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
    <>
      <aside className="hidden lg:block fixed left-0 top-20 bottom-0 w-64 border-r border-gray-100 bg-white z-30">
        <div className="h-full overflow-y-auto px-4 py-6 flex flex-col">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 px-1">分类</h3>

          <div className="space-y-2 flex-1">
            <button
              onClick={() => onSelectClassification(ALL_FILTER)}
              className={`w-full h-10 rounded-lg text-left px-3 text-sm font-bold transition-colors ${
                activeClassification === ALL_FILTER
                  ? 'bg-yellow-400 text-white shadow-[0_4px_12px_rgba(250,204,21,0.35)]'
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
                  className={`w-full h-10 rounded-lg text-left px-3 pr-11 text-sm font-bold transition-colors ${
                    activeClassification === classification
                      ? 'bg-yellow-400 text-white shadow-[0_4px_12px_rgba(250,204,21,0.35)]'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">{classification}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteClassification(classification)}
                  aria-label={`删除分类：${classification}`}
                  disabled={classifications.length <= 1}
                  title={classifications.length <= 1 ? '至少保留一个分类' : `删除分类：${classification}`}
                  className={`absolute right-0 top-0 h-10 w-10 rounded-lg border flex items-center justify-center transition-opacity duration-200 opacity-0 pointer-events-none delay-0 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:delay-[3000ms] ${
                    classifications.length <= 1
                      ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-100 text-gray-400 bg-white hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] tracking-wide text-gray-400">版本 {APP_VERSION}</p>
          </div>
        </div>
      </aside>

      <div className="lg:hidden mb-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">分类</p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => onSelectClassification(ALL_FILTER)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              activeClassification === ALL_FILTER
                ? 'bg-yellow-400 text-white'
                : 'bg-white text-gray-600 border border-gray-100'
            }`}
          >
            全部
          </button>
          {classifications.map((classification) => (
            <button
              key={classification}
              onClick={() => onSelectClassification(classification)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeClassification === classification
                  ? 'bg-yellow-400 text-white'
                  : 'bg-white text-gray-600 border border-gray-100'
              }`}
            >
              {classification}
            </button>
          ))}
        </div>
      </div>
    </>
  );
});
