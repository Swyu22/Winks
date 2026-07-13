import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import {
  DEFAULT_CLASSIFICATIONS,
  DEFAULT_TAGS,
  LINK_DESCRIPTION_MAX_LENGTH,
} from '../lib/constants.js';
import { formatTag, normalizeName, normalizeTag, toSafeHref, uniqueTags } from '../lib/linkMeta.js';
import { ModalDialog } from './ModalDialog.jsx';
import { TaxonomyEditor } from './TaxonomyEditor.jsx';

export const LinkModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  tags,
  classifications,
  onAddTag,
  onDeleteTag,
  onAddClassification,
  onDeleteClassification,
}) => {
  if (!isOpen) return null;

  return (
    <LinkModalContent
      key={initialData?.id || 'create'}
      onClose={onClose}
      onSave={onSave}
      initialData={initialData}
      tags={tags}
      classifications={classifications}
      onAddTag={onAddTag}
      onDeleteTag={onDeleteTag}
      onAddClassification={onAddClassification}
      onDeleteClassification={onDeleteClassification}
    />
  );
};

const createInitialFormData = (initialData, tags, classifications) => {
  if (initialData) {
    return {
      title: initialData.title,
      description: initialData.description || '',
      url: initialData.url,
      tags: uniqueTags(initialData.tags),
      category: normalizeName(initialData.category) || classifications[0] || DEFAULT_CLASSIFICATIONS[0],
    };
  }

  return {
    title: '',
    description: '',
    url: '',
    tags: [tags[0] || DEFAULT_TAGS[0]],
    category: classifications[0] || DEFAULT_CLASSIFICATIONS[0],
  };
};

const getSafeFormData = (formData, tags, classifications) => {
  const availableTags = new Set(tags);
  const nextTags = formData.tags.filter((tag) => availableTags.has(tag));
  const safeTags = nextTags.length > 0 ? nextTags : [tags[0] || DEFAULT_TAGS[0]];
  const safeCategory = classifications.includes(formData.category)
    ? formData.category
    : classifications[0] || DEFAULT_CLASSIFICATIONS[0];

  return { ...formData, tags: safeTags, category: safeCategory };
};

const normalizeHttpUrl = (value) => {
  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) return null;
  const candidate = /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
  return toSafeHref(candidate) === '#' ? null : candidate;
};

const LinkModalContent = ({
  onClose,
  onSave,
  initialData,
  tags,
  classifications,
  onAddTag,
  onDeleteTag,
  onAddClassification,
  onDeleteClassification,
}) => {
  const [formData, setFormData] = useState(() => createInitialFormData(initialData, tags, classifications));
  const [loading, setLoading] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isAddingClassification, setIsAddingClassification] = useState(false);
  const [newClassificationName, setNewClassificationName] = useState('');
  const [urlError, setUrlError] = useState('');
  const safeFormData = getSafeFormData(formData, tags, classifications);
  const selectedTags = new Set(safeFormData.tags);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalUrl = normalizeHttpUrl(safeFormData.url);
    if (!finalUrl) {
      setUrlError('请输入有效的 http(s) 链接地址。');
      e.currentTarget.elements.url?.focus();
      return;
    }
    setLoading(true);

    let saved = false;
    try {
      saved = await onSave({ ...safeFormData, url: finalUrl });
    } finally {
      setLoading(false);
    }

    if (saved) {
      onClose();
    }
  };

  const toggleTag = (tag) => {
    setFormData((prev) => {
      const current = getSafeFormData(prev, tags, classifications);
      const exists = current.tags.includes(tag);
      if (exists) {
        const nextTags = current.tags.filter((item) => item !== tag);
        return { ...current, tags: nextTags.length > 0 ? nextTags : current.tags };
      }
      return { ...current, tags: [...current.tags, tag] };
    });
  };

  const handleCreateTag = () => {
    const normalizedTag = normalizeTag(newTagName);
    if (!normalizedTag) return;
    const createdTag = onAddTag(normalizedTag);
    if (createdTag) {
      setFormData((prev) => {
        const current = getSafeFormData(prev, tags, classifications);
        return { ...current, tags: uniqueTags([...current.tags, createdTag]) };
      });
    }
    setIsAddingTag(false);
    setNewTagName('');
  };

  const handleCreateClassification = () => {
    const normalizedClassification = normalizeName(newClassificationName);
    if (!normalizedClassification) return;
    const createdClassification = onAddClassification(normalizedClassification);
    if (createdClassification) {
      setFormData((prev) => ({ ...prev, category: createdClassification }));
    }
    setIsAddingClassification(false);
    setNewClassificationName('');
  };

  return (
    <ModalDialog
      aria-labelledby="link-modal-title"
      aria-describedby="link-modal-description"
      onClose={onClose}
      className="w-[calc(100%-2rem)] max-w-md backdrop:bg-white/80"
    >
      <div className="w-full bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-6 sm:p-8 relative animate-in zoom-in-95 duration-200">
        <h2 id="link-modal-title" className="text-2xl font-semibold text-gray-800 mb-1">
          {initialData ? '编辑链接' : '新增链接'}
        </h2>
        <p id="link-modal-description" className="text-gray-500 text-sm mb-6">
          {initialData ? '修改现有的网站信息。' : '添加一个新的公共网站到收藏集。'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="link-title-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">标题</label>
            <input
              id="link-title-input"
              name="title"
              required
              type="text"
              maxLength={200}
              autoComplete="off"
              placeholder="例如：Stripe…"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand-100 transition-colors outline-none font-medium text-gray-800 placeholder-gray-500"
              value={safeFormData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="link-description-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
              一句话简介（选填）
            </label>
            <input
              id="link-description-input"
              name="description"
              type="text"
              maxLength={LINK_DESCRIPTION_MAX_LENGTH}
              autoComplete="off"
              placeholder="例如：AI图像创作工具"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand-100 transition-colors outline-none font-medium text-gray-800 placeholder-gray-500"
              value={safeFormData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <label htmlFor="link-url-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">链接地址</label>
            <input
              id="link-url-input"
              name="url"
              required
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(urlError)}
              aria-describedby={urlError ? 'link-url-error' : undefined}
              placeholder="例如：stripe.com…"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand-100 transition-colors outline-none font-medium text-gray-800 placeholder-gray-500"
              value={safeFormData.url}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, url: e.target.value }));
                setUrlError('');
              }}
            />
            <p id="link-url-error" aria-live="polite" className={`mt-1.5 text-xs font-medium text-red-700 ${urlError ? '' : 'sr-only'}`}>
              {urlError}
            </p>
          </div>

          <TaxonomyEditor
            label="分类"
            values={classifications}
            selectedValues={new Set([safeFormData.category])}
            onSelect={(classification) => setFormData((prev) => ({ ...prev, category: classification }))}
            onDelete={onDeleteClassification}
            isAdding={isAddingClassification}
            onStartAdd={() => setIsAddingClassification(true)}
            onCancelAdd={() => setIsAddingClassification(false)}
            addLabel="新增分类"
            inputName="new-classification"
            inputLabel="新分类名称"
            placeholder="输入新分类名称…"
            newValue={newClassificationName}
            onChangeNewValue={setNewClassificationName}
            onCreate={handleCreateClassification}
          />

          <TaxonomyEditor
            label="标签"
            values={tags}
            selectedValues={selectedTags}
            formatValue={formatTag}
            onSelect={toggleTag}
            onDelete={onDeleteTag}
            isAdding={isAddingTag}
            onStartAdd={() => setIsAddingTag(true)}
            onCancelAdd={() => setIsAddingTag(false)}
            addLabel="新增标签"
            inputName="new-tag"
            inputLabel="新标签名称"
            placeholder="输入新标签名称…"
            newValue={newTagName}
            onChangeNewValue={setNewTagName}
            onCreate={handleCreateTag}
          />

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="w-full h-12 mt-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-950 hover:shadow-lg hover:shadow-[0_10px_25px_-5px_rgba(255,208,0,0.25)] active:scale-[0.98] transition-[background-color,box-shadow,transform] flex items-center justify-center gap-2"
          >
            {loading && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}
            <span>{loading ? '保存中…' : (initialData ? '保存修改' : '保存链接')}</span>
          </button>
        </form>
        <button
          type="button"
          aria-label="关闭链接弹窗"
          onClick={onClose}
          className="absolute top-4 right-4 size-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
    </ModalDialog>
  );
};
