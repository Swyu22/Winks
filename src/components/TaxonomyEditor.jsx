import { Plus, X } from 'lucide-react';

const identity = (value) => value;

export const TaxonomyEditor = ({
  addLabel,
  formatValue = identity,
  inputLabel,
  inputName,
  isAdding,
  label,
  newValue,
  onCancelAdd,
  onChangeNewValue,
  onCreate,
  onDelete,
  onSelect,
  onStartAdd,
  placeholder,
  selectedValues,
  values,
}) => {
  const canDelete = values.length > 1;

  return (
    <div>
      <p className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
        {label}
      </p>

      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((value) => {
          const displayValue = formatValue(value);
          const selected = selectedValues.has(value);

          return (
            <div key={value} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelect(value)}
                aria-pressed={selected}
                className={`h-8 px-3 text-xs font-bold rounded-lg border transition-colors inline-flex items-center justify-center ${
                  selected
                    ? 'bg-brand border-brand text-brand-foreground shadow-md'
                    : 'bg-white border-gray-100 text-gray-500 hover:border-brand-200'
                }`}
              >
                {displayValue}
              </button>
              <button
                type="button"
                onClick={() => onDelete(value)}
                aria-label={`删除${label}：${displayValue}`}
                disabled={!canDelete}
                title={canDelete ? `删除${label}：${displayValue}` : `至少保留一个${label}`}
                className={`size-8 rounded-lg border flex items-center justify-center transition-colors ${
                  canDelete
                    ? 'border-gray-100 text-gray-500 bg-white hover:border-red-300 hover:text-red-700'
                    : 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </div>
          );
        })}

        {!isAdding && (
          <button
            type="button"
            onClick={onStartAdd}
            className="h-8 px-3 text-xs font-bold rounded-lg border border-dashed border-gray-300 text-gray-600 hover:border-brand hover:text-brand-text flex items-center gap-1 bg-gray-50 hover:bg-white transition-colors"
          >
            <Plus aria-hidden="true" className="size-3" /> {addLabel}
          </button>
        )}
      </div>

      {isAdding && (
        <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            name={inputName}
            aria-label={inputLabel}
            autoComplete="off"
            placeholder={placeholder}
            className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-white border border-brand-200 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            value={newValue}
            onChange={(event) => onChangeNewValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onCreate();
              }
            }}
          />
          <button
            type="button"
            onClick={onCreate}
            className="h-10 px-4 bg-brand text-brand-foreground rounded-lg text-sm font-bold hover:shadow-lg inline-flex items-center justify-center"
          >
            确认
          </button>
          <button
            type="button"
            aria-label={`取消${addLabel}`}
            onClick={onCancelAdd}
            className="size-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};
