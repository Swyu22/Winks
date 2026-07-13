import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { formatTag, getFaviconCandidates, toSafeHref } from '../lib/linkMeta.js';

export const LinkCard = memo(function LinkCard({ link, onEdit, onDelete, onOpen }) {
  const [iconIdx, setIconIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const imgRef = useRef(null);
  const candidates = useMemo(() => getFaviconCandidates(link.url), [link.url]);
  const current = candidates[iconIdx];
  // Card instances are keyed by link.id, so editing a link's URL reuses the instance;
  // restart the favicon source cascade when the URL changes.
  useEffect(() => {
    setIconIdx(0);
  }, [link.url]);
  // Per-source timeout: a source that hangs (or 404s slowly) fires load/error too late, which
  // would stall the cascade — and the letter-avatar fallback. Each candidate carries its own
  // budget (short for the quick /icon.svg probe, generous for the reliable services) so a slow
  // source falls through fast without cutting off a merely-slow real icon.
  useEffect(() => {
    if (!current) return undefined;
    const timer = setTimeout(() => {
      const img = imgRef.current;
      if (img && !(img.complete && img.naturalWidth > 0)) setIconIdx((i) => i + 1);
    }, current.timeout);
    return () => clearTimeout(timer);
  }, [current]);
  const handleOpen = useCallback(() => {
    onOpen?.(link);
  }, [link, onOpen]);
  // onError = the source failed to load at all (404/non-image/unreachable) → try the next.
  const handleIconError = useCallback(() => setIconIdx((i) => i + 1), []);
  // faviconV2 answers a miss with a tiny (~16px) placeholder via a 200/404 image body — which
  // fires load, not error, and would otherwise stick. A site with no icon discoverable by it
  // has none we can fetch, so drop straight to the letter avatar (skip remaining candidates).
  const handleIconLoad = useCallback(
    (e) => {
      const isFaviconV2 = e.currentTarget.src.includes('faviconV2');
      if (isFaviconV2 && e.currentTarget.naturalWidth > 0 && e.currentTarget.naturalWidth <= 16) {
        setIconIdx(candidates.length);
      }
    },
    [candidates.length],
  );
  const handleEdit = useCallback(
    (e) => {
      e.preventDefault();
      onEdit(link);
    },
    [link, onEdit],
  );
  const handleDelete = useCallback(
    (e) => {
      e.preventDefault();
      onDelete(link);
    },
    [link, onDelete],
  );
  const handleCopy = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(link.url);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = link.url;
          textarea.setAttribute('readonly', '');
          textarea.style.cssText = 'position: fixed; opacity: 0;';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch {
        alert('复制链接失败，请重试。');
      }
    },
    [link.url],
  );

  return (
    <div
      className="group relative flex flex-col p-6 pb-16 min-h-[10rem] bg-white rounded-2xl border border-gray-100 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_0_30px_rgba(255,208,0,0.25)]"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '160px' }}
    >
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 z-10">
        <button
          type="button"
          onClick={handleEdit}
          aria-label={`编辑链接：${link.title}`}
          className="p-1.5 bg-white border border-gray-100 hover:bg-brand hover:text-brand-foreground rounded-lg text-slate-600 transition-colors"
          title="编辑"
        >
          <Pencil aria-hidden="true" className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`删除链接：${link.title}`}
          className="p-1.5 bg-white border border-gray-100 hover:bg-red-500 hover:text-white rounded-lg text-slate-600 transition-colors"
          title="删除"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
        </button>
      </div>

      <a
        href={toSafeHref(link.url)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className="flex-1 flex flex-col"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            {current?.url ? (
              <img
                ref={imgRef}
                src={current.url}
                alt=""
                width={40}
                height={40}
                onError={handleIconError}
                onLoad={handleIconLoad}
                loading="lazy"
                decoding="async"
                className="size-10 rounded-lg object-contain bg-gray-50 p-1"
              />
            ) : (
              <div aria-hidden="true" className="size-9 rounded-lg bg-brand flex items-center justify-center font-bold text-[21px] text-white">
                {link.title.trim().charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <h3 className="font-semibold text-gray-800 truncate pr-4 text-lg group-hover:text-brand-text transition-colors">
            {link.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {link.tags.map((tag) => (
              <span key={`${link.id}-${tag}`} className="inline-block text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                {formatTag(tag)}
              </span>
            ))}
          </div>
        </div>
      </a>

      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? `已复制链接：${link.title}` : `复制链接：${link.title}`}
        aria-live="polite"
        className={`absolute left-6 bottom-4 h-8 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 ${
          copied
            ? 'bg-green-50 text-green-600 border-green-200'
            : 'bg-white text-gray-500 border-gray-100 hover:border-brand-200 hover:text-brand-text'
        }`}
        title="复制链接"
      >
        <Copy aria-hidden="true" className="size-3.5" />
        {copied ? '已复制' : '复制链接'}
      </button>
    </div>
  );
});
