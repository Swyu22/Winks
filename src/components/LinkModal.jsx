import { useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { DEFAULT_CLASSIFICATIONS, DEFAULT_TAGS } from '../lib/constants.js';
import { formatTag, normalizeName, normalizeTag, uniqueTags } from '../lib/linkMeta.js';

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
      url: initialData.url,
      tags: uniqueTags(initialData.tags),
      category: normalizeName(initialData.category) || classifications[0] || DEFAULT_CLASSIFICATIONS[0],
    };
  }

  return {
    title: '',
    url: '',
    tags: [tags[0] || DEFAULT_TAGS[0]],
    category: classifications[0] || DEFAULT_CLASSIFICATIONS[0],
  };
};

const getSafeFormData = (formData, tags, classifications) => {
  const nextTags = formData.tags.filter((tag) => tags.includes(tag));
  const safeTags = nextTags.length > 0 ? nextTags : [tags[0] || DEFAULT_TAGS[0]];
  const safeCategory = classifications.includes(formData.category)
    ? formData.category
    : classifications[0] || DEFAULT_CLASSIFICATIONS[0];

  return { ...formData, tags: safeTags, category: safeCategory };
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
  const safeFormData = getSafeFormData(formData, tags, classifications);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let finalUrl = safeFormData.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-8 relative zoom-in-95 duration-200">
        <button
          type="button"
          aria-label="关闭链接弹窗"
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-800"
        >
          <X aria-hidden="true" className="size-5" />
        </button>

        <h2 id="link-modal-title" className="text-2xl font-semibold text-gray-800 mb-1">
          {initialData ? '编辑链接' : '新增链接'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {initialData ? '修改现有的网站信息。' : '添加一个新的公共网站到收藏集。'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="link-title-input" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">标题</label>
            <input
              id="link-title-input"
              name="title"
              required
              autoFocus
              type="text"
              autoComplete="off"
              placeholder="例如：Stripe…"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand-100 transition-colors outline-none font-medium text-gray-800 placeholder-gray-300"
              value={safeFormData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
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
              placeholder="例如：stripe.com…"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand-100 transition-colors outline-none font-medium text-gray-800 placeholder-gray-300"
              value={safeFormData.url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
            />
          </div>

          <div>
            <p className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">分类</p>

            <div className="flex flex-wrap gap-2 mb-2">
              {classifications.map((classification) => (
                <div key={classification} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: classification }))}
                    className={`h-8 px-3 text-xs font-bold rounded-lg border transition-colors ${
                      safeFormData.category === classification
                        ? 'bg-brand border-brand text-brand-foreground shadow-md'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-brand-200'
                    }`}
                  >
                    {classification}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteClassification(classification)}
                    aria-label={`删除分类：${classification}`}
                    disabled={classifications.length <= 1}
                    title={classifications.length <= 1 ? '至少保留一个分类' : `删除分类：${classification}`}
                    className={`size-8 rounded-lg border flex items-center justify-center transition-colors ${
                      classifications.length <= 1
                        ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-100 text-gray-400 bg-white hover:border-red-300 hover:text-red-500'
                    }`}
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              ))}

              {!isAddingClassification && (
                <button
                  type="button"
                  onClick={() => setIsAddingClassification(true)}
                  className="h-8 px-3 text-xs font-bold rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-brand hover:text-brand-text flex items-center gap-1 bg-gray-50 hover:bg-white transition-colors"
                >
                  <Plus aria-hidden="true" className="size-3" /> 新增分类
                </button>
              )}
            </div>

            {isAddingClassification && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 mb-3">
                <input
                  type="text"
                  name="new-classification"
                  aria-label="新分类名称"
                  autoComplete="off"
                  placeholder="输入新分类名称…"
                  className="flex-1 h-10 px-3 rounded-lg bg-white border border-brand-200 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                  value={newClassificationName}
                  onChange={(e) => setNewClassificationName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCreateClassification}
                  className="h-10 px-4 bg-brand text-brand-foreground rounded-lg text-sm font-bold hover:shadow-lg"
                >
                  确认
                </button>
                <button
                  type="button"
                  aria-label="取消新增分类"
                  onClick={() => setIsAddingClassification(false)}
                  className="size-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <p className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">标签</p>

            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <div key={tag} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`h-8 px-3 text-xs font-bold rounded-lg border transition-colors ${
                      safeFormData.tags.includes(tag)
                        ? 'bg-brand border-brand text-brand-foreground shadow-md'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-brand-200'
                    }`}
                  >
                    {formatTag(tag)}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTag(tag)}
                    aria-label={`删除标签：${formatTag(tag)}`}
                    disabled={tags.length <= 1}
                    title={tags.length <= 1 ? '至少保留一个标签' : `删除标签：${formatTag(tag)}`}
                    className={`size-8 rounded-lg border flex items-center justify-center transition-colors ${
                      tags.length <= 1
                        ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-100 text-gray-400 bg-white hover:border-red-300 hover:text-red-500'
                    }`}
                  >
                    <X aria-hidden="true" className="size-3.5" />
                  </button>
                </div>
              ))}

              {!isAddingTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="h-8 px-3 text-xs font-bold rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-brand hover:text-brand-text flex items-center gap-1 bg-gray-50 hover:bg-white transition-colors"
                >
                  <Plus aria-hidden="true" className="size-3" /> 新增标签
                </button>
              )}
            </div>

            {isAddingTag && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                <input
                  type="text"
                  name="new-tag"
                  aria-label="新标签名称"
                  autoComplete="off"
                  placeholder="输入新标签名称…"
                  className="flex-1 h-10 px-3 rounded-lg bg-white border border-brand-200 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="h-10 px-4 bg-brand text-brand-foreground rounded-lg text-sm font-bold hover:shadow-lg"
                >
                  确认
                </button>
                <button
                  type="button"
                  aria-label="取消新增标签"
                  onClick={() => setIsAddingTag(false)}
                  className="size-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-950 hover:shadow-lg hover:shadow-[0_10px_25px_-5px_rgba(255,208,0,0.25)] active:scale-[0.98] transition-[background-color,box-shadow,transform] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : (initialData ? '保存修改' : '保存链接')}
          </button>
        </form>
      </div>
    </div>
  );
};
