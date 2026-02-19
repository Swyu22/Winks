import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Loader2, X, Zap, Pencil, Trash2, Lock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ==========================================
// 🚀 部署配置开关 (DEPLOYMENT CONFIG)
// ==========================================
// 本地开发预览设为 true。
// 正式上线连接 Supabase 时设为 false，并确保配置了 .env 环境变量。
const USE_DEMO_MODE = false; 

// ==========================================
// 🛠️ 初始化 Supabase
// ==========================================
let supabase = null;
let supabaseInitError = '';

if (!USE_DEMO_MODE) {
  // 生产环境配置
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    supabaseInitError = '缺少 Supabase 环境变量，请检查 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。';
    console.error(supabaseInitError);
  }
}

// ==========================================
// 🧩 辅助工具
// ==========================================
const getFaviconUrl = (url) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

const DEFAULT_TAGS = ['设计', '开发', '工具', '阅读', '灵感'];
const DEFAULT_CLASSIFICATIONS = ['未分类'];
const LINK_META_PREFIX = '__WINKS_META__';
const APP_VERSION = 'v1.1.1';

const normalizeName = (value) => String(value || '').replace(/^#+\s*/, '').trim();

const normalizeTag = (value) => normalizeName(value);

const parseTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((tag) => normalizeTag(String(tag))).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  return value
    .split(/[,\uFF0C]+/)
    .map((tag) => normalizeTag(tag))
    .filter(Boolean);
};

const uniqueTags = (tags) => Array.from(new Set(tags.map((tag) => normalizeTag(tag)).filter(Boolean)));
const uniqueClassifications = (items) => Array.from(new Set(items.map((item) => normalizeName(item)).filter(Boolean)));

const formatTag = (tag) => `#${tag}`;

const encodeLinkMeta = (classification, tags) =>
  `${LINK_META_PREFIX}${JSON.stringify({
    classification: normalizeName(classification) || DEFAULT_CLASSIFICATIONS[0],
    tags: uniqueTags(tags),
  })}`;

const decodeLinkMeta = (rawValue) => {
  if (typeof rawValue !== 'string' || !rawValue.startsWith(LINK_META_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(rawValue.slice(LINK_META_PREFIX.length));
  } catch {
    return null;
  }
};

const hydrateLink = (link) => {
  const metadata = decodeLinkMeta(link.category);
  const legacyTags = uniqueTags(parseTags(link.tags ?? link.category));
  const tags =
    uniqueTags(metadata?.tags || legacyTags).length > 0
      ? uniqueTags(metadata?.tags || legacyTags)
      : [DEFAULT_TAGS[0]];
  const classification = normalizeName(metadata?.classification) || DEFAULT_CLASSIFICATIONS[0];

  return {
    ...link,
    tags,
    category: classification,
  };
};

const collectTagsFromLinks = (items) => {
  const allTags = items.flatMap((item) => item.tags || []);
  const normalizedTags = uniqueTags(allTags);
  return normalizedTags.length > 0 ? normalizedTags : DEFAULT_TAGS;
};

const collectClassificationsFromLinks = (items) => {
  const normalizedClassifications = uniqueClassifications(items.map((item) => item.category));
  if (normalizedClassifications.length === 0) {
    return DEFAULT_CLASSIFICATIONS;
  }

  return uniqueClassifications([DEFAULT_CLASSIFICATIONS[0], ...normalizedClassifications]);
};

// ==========================================
// 🔐 安全组件 (Security)
// ==========================================

const PinModal = ({ isOpen, onClose, onSuccess }) => {
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
    if (pin === '5185') {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 relative zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
          <X className="w-4 h-4" />
        </button>
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 text-yellow-600">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900">安全验证</h3>
          <p className="text-xs text-gray-500 mt-1">执行此操作需要管理员密码</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="password"
            maxLength={4}
            placeholder="输入密码"
            className={`w-full text-center text-2xl tracking-[0.5em] font-bold h-12 rounded-xl bg-gray-50 border-2 outline-none transition-all ${error ? 'border-red-400 bg-red-50 text-red-500 placeholder-red-300' : 'border-gray-100 focus:border-yellow-400 focus:bg-white text-gray-800'}`}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
          />
          {error && <p className="text-red-500 text-xs text-center mt-2 font-bold">密码错误</p>}
          <button type="submit" className="w-full mt-4 h-10 bg-gray-900 text-white rounded-lg font-bold text-sm hover:bg-black transition-colors">
            确认
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 🎨 业务组件 (Components)
// ==========================================

const Logo = () => (
  <div className="flex items-center gap-2 group cursor-pointer select-none">
    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.4)] group-hover:shadow-[0_0_15px_rgba(250,204,21,0.6)] transition-all duration-300">
      <Zap className="w-5 h-5 text-white fill-white" />
    </div>
    <span className="font-bold text-xl tracking-tight text-gray-800">Winks.闪链</span>
  </div>
);

const LinkCard = ({ link, onEdit, onDelete }) => {
  const [imgError, setImgError] = useState(false);
  const favicon = getFaviconUrl(link.url);

  return (
    <div className="group relative flex flex-col p-6 min-h-[10rem] bg-white rounded-2xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:border-yellow-200 hover:shadow-[0_0_30px_rgba(250,204,21,0.25)]">
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <button
          onClick={(e) => { e.preventDefault(); onEdit(link); }}
          className="p-1.5 bg-gray-100 hover:bg-yellow-400 hover:text-white rounded-lg text-gray-500 transition-colors"
          title="编辑"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(link); }}
          className="p-1.5 bg-gray-100 hover:bg-red-500 hover:text-white rounded-lg text-gray-500 transition-colors"
          title="删除"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            {!imgError && favicon ? (
              <img
                src={favicon}
                alt={link.title}
                onError={() => setImgError(true)}
                className="w-10 h-10 rounded-lg object-contain bg-gray-50 p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-lg">
                {link.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-auto">
          <h3 className="font-bold text-gray-800 truncate pr-4 text-lg group-hover:text-yellow-600 transition-colors">
            {link.title}
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {link.tags.map((tag) => (
              <span key={`${link.id}-${tag}`} className="inline-block text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                {formatTag(tag)}
              </span>
            ))}
          </div>
        </div>
      </a>
    </div>
  );
};

// Unified Modal for Add and Edit
const LinkModal = ({
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
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    tags: [DEFAULT_TAGS[0]],
    category: DEFAULT_CLASSIFICATIONS[0],
  });
  const [loading, setLoading] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isAddingClassification, setIsAddingClassification] = useState(false);
  const [newClassificationName, setNewClassificationName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          url: initialData.url,
          tags: uniqueTags(initialData.tags),
          category: normalizeName(initialData.category) || classifications[0] || DEFAULT_CLASSIFICATIONS[0],
        });
      } else {
        setFormData({
          title: '',
          url: '',
          tags: [tags[0] || DEFAULT_TAGS[0]],
          category: classifications[0] || DEFAULT_CLASSIFICATIONS[0],
        });
      }
      setIsAddingTag(false);
      setNewTagName('');
      setIsAddingClassification(false);
      setNewClassificationName('');
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData((prev) => {
      const nextTags = prev.tags.filter((tag) => tags.includes(tag));
      const safeTags = nextTags.length > 0 ? nextTags : [tags[0] || DEFAULT_TAGS[0]];
      const safeCategory = classifications.includes(prev.category)
        ? prev.category
        : classifications[0] || DEFAULT_CLASSIFICATIONS[0];

      return { ...prev, tags: safeTags, category: safeCategory };
    });
  }, [tags, classifications, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let finalUrl = formData.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (USE_DEMO_MODE) await new Promise((r) => setTimeout(r, 600));

    let saved = false;
    try {
      saved = await onSave({ ...formData, url: finalUrl });
    } finally {
      setLoading(false);
    }

    if (saved) {
      onClose();
    }
  };

  const toggleTag = (tag) => {
    setFormData((prev) => {
      const exists = prev.tags.includes(tag);
      if (exists) {
        const nextTags = prev.tags.filter((item) => item !== tag);
        return { ...prev, tags: nextTags.length > 0 ? nextTags : prev.tags };
      }
      return { ...prev, tags: [...prev.tags, tag] };
    });
  };

  const handleCreateTag = () => {
    const normalizedTag = normalizeTag(newTagName);
    if (!normalizedTag) return;
    const createdTag = onAddTag(normalizedTag);
    if (createdTag) {
      setFormData((prev) => ({ ...prev, tags: uniqueTags([...prev.tags, createdTag]) }));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 p-8 relative zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          {initialData ? '编辑链接' : '新增链接'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {initialData ? '修改现有的网站信息。' : '添加一个新的公共网站到收藏集。'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">标题</label>
            <input
              required
              type="text"
              placeholder="例如: Stripe"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all outline-none font-medium text-gray-800 placeholder-gray-300"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">链接地址</label>
            <input
              required
              type="text"
              placeholder="stripe.com"
              className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 transition-all outline-none font-medium text-gray-800 placeholder-gray-300"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">分类</label>

            <div className="flex flex-wrap gap-2 mb-2">
              {classifications.map((classification) => (
                <div key={classification} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, category: classification }))}
                    className={`h-8 px-3 text-xs font-bold rounded-lg border transition-all ${
                      formData.category === classification
                        ? 'bg-yellow-400 border-yellow-400 text-white shadow-md'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-yellow-200'
                    }`}
                  >
                    {classification}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteClassification(classification)}
                    disabled={classifications.length <= 1}
                    title={classifications.length <= 1 ? '至少保留一个分类' : `删除分类：${classification}`}
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
                      classifications.length <= 1
                        ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-100 text-gray-400 bg-white hover:border-red-300 hover:text-red-500'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {!isAddingClassification && (
                <button
                  type="button"
                  onClick={() => setIsAddingClassification(true)}
                  className="h-8 px-3 text-xs font-bold rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-yellow-400 hover:text-yellow-600 flex items-center gap-1 bg-gray-50 hover:bg-white transition-all"
                >
                  <Plus className="w-3 h-3" /> 新增分类
                </button>
              )}
            </div>

            {isAddingClassification && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 mb-3">
                <input
                  autoFocus
                  type="text"
                  placeholder="输入新分类名称..."
                  className="flex-1 h-10 px-3 rounded-lg bg-white border border-yellow-200 focus:ring-2 focus:ring-yellow-100 outline-none text-sm"
                  value={newClassificationName}
                  onChange={(e) => setNewClassificationName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCreateClassification}
                  className="h-10 px-4 bg-yellow-400 text-white rounded-lg text-sm font-bold hover:shadow-lg"
                >
                  确认
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingClassification(false)}
                  className="h-10 w-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">标签</label>

            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <div key={tag} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`h-8 px-3 text-xs font-bold rounded-lg border transition-all ${
                      formData.tags.includes(tag)
                        ? 'bg-yellow-400 border-yellow-400 text-white shadow-md'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-yellow-200'
                    }`}
                  >
                    {formatTag(tag)}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteTag(tag)}
                    disabled={tags.length <= 1}
                    title={tags.length <= 1 ? '至少保留一个标签' : `删除标签：${formatTag(tag)}`}
                    className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-all ${
                      tags.length <= 1
                        ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-100 text-gray-400 bg-white hover:border-red-300 hover:text-red-500'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {!isAddingTag && (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="h-8 px-3 text-xs font-bold rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-yellow-400 hover:text-yellow-600 flex items-center gap-1 bg-gray-50 hover:bg-white transition-all"
                >
                  <Plus className="w-3 h-3" /> 新增标签
                </button>
              )}
            </div>

            {isAddingTag && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="输入新标签名称..."
                  className="flex-1 h-10 px-3 rounded-lg bg-white border border-yellow-200 focus:ring-2 focus:ring-yellow-100 outline-none text-sm"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="h-10 px-4 bg-yellow-400 text-white rounded-lg text-sm font-bold hover:shadow-lg"
                >
                  确认
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingTag(false)}
                  className="h-10 w-10 flex items-center justify-center bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black hover:shadow-lg hover:shadow-yellow-400/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (initialData ? '保存修改' : '保存链接')}
          </button>
        </form>
      </div>
    </div>
  );
};

const CategorySidebar = ({
  classifications,
  activeClassification,
  onSelectClassification,
  onDeleteClassification,
}) => {
  return (
    <>
      <aside className="hidden lg:block fixed left-0 top-20 bottom-0 w-64 border-r border-gray-100 bg-white z-30">
        <div className="h-full overflow-y-auto px-4 py-6 flex flex-col">
          <h3 className="text-sm font-bold text-gray-700 mb-4 px-1">分类</h3>

          <div className="space-y-2 flex-1">
            <button
              onClick={() => onSelectClassification('全部')}
              className={`w-full h-10 rounded-lg text-left px-3 text-sm font-bold transition-all ${
                activeClassification === '全部'
                  ? 'bg-yellow-400 text-white shadow-[0_4px_12px_rgba(250,204,21,0.35)]'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              全部
            </button>

            {classifications.map((classification) => (
              <div key={classification} className="group relative">
                <button
                  onClick={() => onSelectClassification(classification)}
                  className={`w-full h-10 rounded-lg text-left px-3 pr-11 text-sm font-bold transition-all ${
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
                  disabled={classifications.length <= 1}
                  title={classifications.length <= 1 ? '至少保留一个分类' : `删除分类：${classification}`}
                  className={`absolute right-0 top-0 h-10 w-10 rounded-lg border flex items-center justify-center transition-opacity duration-200 opacity-0 pointer-events-none delay-0 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:delay-[3000ms] ${
                    classifications.length <= 1
                      ? 'border-gray-100 text-gray-300 bg-gray-50 cursor-not-allowed'
                      : 'border-gray-100 text-gray-400 bg-white hover:border-red-300 hover:text-red-500'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
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
            onClick={() => onSelectClassification('全部')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeClassification === '全部'
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
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
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
};

// ==========================================
// 🚀 主程序 (Main App)
// ==========================================

export default function App() {
  const [links, setLinks] = useState([]);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [classifications, setClassifications] = useState(DEFAULT_CLASSIFICATIONS);
  const [tagFilter, setTagFilter] = useState('全部');
  const [classificationFilter, setClassificationFilter] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState(supabaseInitError);

  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null); 
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const showSupabaseError = (action, error) => {
    const message = error?.message || '未知错误';
    console.error(`${action}失败:`, message);
    alert(`${action}失败：${message}`);
  };

  const fetchLinks = async () => {
    setLoading(true);

    if (!USE_DEMO_MODE && !supabase) {
      setFatalError(supabaseInitError || 'Supabase 初始化失败，请检查环境变量配置。');
      setLoading(false);
      return;
    }
    
    if (USE_DEMO_MODE) {
      setTimeout(() => {
        const demoLinks = [
          {
            id: 1,
            title: 'Supabase',
            url: 'https://supabase.com',
            category: encodeLinkMeta('开发', ['开发', '工具']),
          },
          {
            id: 2,
            title: 'Tailwind CSS',
            url: 'https://tailwindcss.com',
            category: encodeLinkMeta('开发', ['开发', '设计']),
          },
          {
            id: 3,
            title: 'Dribbble',
            url: 'https://dribbble.com',
            category: encodeLinkMeta('设计', ['设计', '灵感']),
          },
          {
            id: 4,
            title: 'Framer',
            url: 'https://framer.com',
            category: encodeLinkMeta('设计', ['设计', '工具']),
          },
          {
            id: 5,
            title: 'Linear',
            url: 'https://linear.app',
            category: encodeLinkMeta('工具', ['工具']),
          },
        ];
        const normalizedLinks = demoLinks.map((link) => hydrateLink(link));
        setLinks(normalizedLinks);
        setTags(collectTagsFromLinks(normalizedLinks));
        setClassifications(collectClassificationsFromLinks(normalizedLinks));
        setFatalError('');
        setLoading(false);
      }, 800);
    } else if (supabase) {
      const { data, error } = await supabase
        .from('links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        showSupabaseError('加载数据', error);
      } else if (data) {
        const normalizedLinks = data.map((link) => hydrateLink(link));
        setLinks(normalizedLinks);
        setTags(collectTagsFromLinks(normalizedLinks));
        setClassifications(collectClassificationsFromLinks(normalizedLinks));
        setFatalError('');
      }
      setLoading(false);
    }
  };

  const requestAuth = (action) => {
    setPendingAction(action);
    setIsPinOpen(true);
  };

  const handlePinSuccess = async () => {
    if (!pendingAction) return;

    const { type, payload } = pendingAction;
    
    if (type === 'DELETE_LINK') {
      await executeDeleteLink(payload);
    } else if (type === 'EDIT_LINK') {
      setEditingLink(payload);
      setIsModalOpen(true);
    } else if (type === 'DELETE_CLASSIFICATION') {
      await executeDeleteClassification(payload);
    }
    
    setPendingAction(null);
  };

  const executeAddTag = (newTag) => {
    const normalizedTag = normalizeTag(newTag);
    if (!normalizedTag) {
      return null;
    }

    if (!tags.includes(normalizedTag)) {
      setTags((prev) => [...prev, normalizedTag]);
    }

    return normalizedTag;
  };

  const executeDeleteTag = async (tagToDelete) => {
    const normalizedTag = normalizeTag(tagToDelete);

    if (!tags.includes(normalizedTag)) {
      return;
    }

    if (tags.length <= 1) {
      alert('至少保留一个标签。');
      return;
    }

    const fallbackTag = tags.find((tag) => tag !== normalizedTag) || DEFAULT_TAGS[0];

    const applyLocalTagDelete = () => {
      setTags((prev) => prev.filter((tag) => tag !== normalizedTag));
      setLinks((prev) =>
        prev.map((link) =>
          link.tags.includes(normalizedTag)
            ? (() => {
                const nextTags = link.tags.filter((tag) => tag !== normalizedTag);
                const safeTags = nextTags.length > 0 ? nextTags : [fallbackTag];
                return { ...link, tags: safeTags };
              })()
            : link,
        ),
      );
      setTagFilter((prev) => (prev === normalizedTag ? '全部' : prev));
      setEditingLink((prev) =>
        prev && prev.tags.includes(normalizedTag)
          ? (() => {
              const nextTags = prev.tags.filter((tag) => tag !== normalizedTag);
              const safeTags = nextTags.length > 0 ? nextTags : [fallbackTag];
              return { ...prev, tags: safeTags };
            })()
          : prev,
      );
    };

    if (USE_DEMO_MODE) {
      applyLocalTagDelete();
      return;
    }

    if (supabase) {
      const affectedLinks = links.filter((link) => link.tags.includes(normalizedTag));

      const updateResults = await Promise.all(
        affectedLinks.map((link) => {
          const nextTags = link.tags.filter((tag) => tag !== normalizedTag);
          const safeTags = nextTags.length > 0 ? nextTags : [fallbackTag];
          return supabase
            .from('links')
            .update({ category: encodeLinkMeta(link.category, safeTags) })
            .eq('id', link.id);
        }),
      );

      const failed = updateResults.find((result) => result.error);
      if (failed?.error) {
        showSupabaseError('删除标签', failed.error);
        return;
      }

      applyLocalTagDelete();
    } else {
      alert('Supabase 未初始化，无法删除标签。');
    }
  };

  const executeAddClassification = (newClassification) => {
    const normalizedClassification = normalizeName(newClassification);
    if (!normalizedClassification) {
      return null;
    }

    if (!classifications.includes(normalizedClassification)) {
      setClassifications((prev) => [...prev, normalizedClassification]);
    }

    return normalizedClassification;
  };

  const executeDeleteClassification = async (classificationToDelete) => {
    const normalizedClassification = normalizeName(classificationToDelete);

    if (!classifications.includes(normalizedClassification)) {
      return;
    }

    if (classifications.length <= 1) {
      alert('至少保留一个分类。');
      return;
    }

    const fallbackClassification =
      classifications.find((classification) => classification !== normalizedClassification) ||
      DEFAULT_CLASSIFICATIONS[0];

    const applyLocalClassificationDelete = () => {
      setClassifications((prev) =>
        prev.filter((classification) => classification !== normalizedClassification),
      );
      setLinks((prev) =>
        prev.map((link) =>
          link.category === normalizedClassification
            ? { ...link, category: fallbackClassification }
            : link,
        ),
      );
      setClassificationFilter((prev) => (prev === normalizedClassification ? '全部' : prev));
      setEditingLink((prev) =>
        prev && prev.category === normalizedClassification
          ? { ...prev, category: fallbackClassification }
          : prev,
      );
    };

    if (USE_DEMO_MODE) {
      applyLocalClassificationDelete();
      return;
    }

    if (supabase) {
      const affectedLinks = links.filter((link) => link.category === normalizedClassification);
      const updateResults = await Promise.all(
        affectedLinks.map((link) =>
          supabase
            .from('links')
            .update({ category: encodeLinkMeta(fallbackClassification, link.tags) })
            .eq('id', link.id),
        ),
      );

      const failed = updateResults.find((result) => result.error);
      if (failed?.error) {
        showSupabaseError('删除分类', failed.error);
        return;
      }

      applyLocalClassificationDelete();
    } else {
      alert('Supabase 未初始化，无法删除分类。');
    }
  };

  const executeDeleteLink = async (linkToDelete) => {
    if (USE_DEMO_MODE) {
      setLinks((prev) => prev.filter((l) => l.id !== linkToDelete.id));
    } else if (supabase) {
      const { error } = await supabase.from('links').delete().eq('id', linkToDelete.id);
      if (error) {
        showSupabaseError('删除链接', error);
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== linkToDelete.id));
    } else {
      alert('Supabase 未初始化，无法删除链接。');
    }
  };

  const handleSaveLink = async (linkData) => {
    if (!USE_DEMO_MODE && !supabase) {
      alert('Supabase 未初始化，无法保存链接。');
      return false;
    }

    const normalizedTags = uniqueTags(parseTags(linkData.tags));
    const safeTags = normalizedTags.length > 0 ? normalizedTags : [tags[0] || DEFAULT_TAGS[0]];
    const safeClassification =
      normalizeName(linkData.category) || classifications[0] || DEFAULT_CLASSIFICATIONS[0];
    const normalizedLinkData = {
      ...linkData,
      tags: safeTags,
      category: safeClassification,
    };
    const dbPayload = {
      title: normalizedLinkData.title,
      url: normalizedLinkData.url,
      category: encodeLinkMeta(safeClassification, safeTags),
    };

    if (editingLink) {
      // Update
      if (USE_DEMO_MODE) {
        setLinks((prev) => prev.map((l) => (l.id === editingLink.id ? { ...l, ...normalizedLinkData } : l)));
        setTags((prev) => uniqueTags([...prev, ...normalizedLinkData.tags]));
        setClassifications((prev) => uniqueClassifications([...prev, normalizedLinkData.category]));
        return true;
      } else if (supabase) {
        const { data, error } = await supabase
          .from('links')
          .update(dbPayload)
          .eq('id', editingLink.id)
          .select();
        if (error) {
          showSupabaseError('更新链接', error);
          return false;
        }
        if (data?.[0]) {
          const hydrated = hydrateLink(data[0]);
          setLinks((prev) => prev.map((link) => (link.id === hydrated.id ? hydrated : link)));
          setTags((prev) => uniqueTags([...prev, ...hydrated.tags]));
          setClassifications((prev) => uniqueClassifications([...prev, hydrated.category]));
        }
        return true;
      }
    } else {
      // Create
      const newLink = { ...normalizedLinkData, id: Date.now() };
      if (USE_DEMO_MODE) {
        setLinks((prev) => [newLink, ...prev]);
        setTags((prev) => uniqueTags([...prev, ...normalizedLinkData.tags]));
        setClassifications((prev) => uniqueClassifications([...prev, normalizedLinkData.category]));
        return true;
      } else if (supabase) {
        const { data, error } = await supabase.from('links').insert([dbPayload]).select();
        if (error) {
          showSupabaseError('新增链接', error);
          return false;
        }
        if (data?.[0]) {
          const hydrated = hydrateLink(data[0]);
          setLinks((prev) => [hydrated, ...prev]);
          setTags((prev) => uniqueTags([...prev, ...hydrated.tags]));
          setClassifications((prev) => uniqueClassifications([...prev, hydrated.category]));
        }
        return true;
      }
    }

    return false;
  };

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const matchesClassification =
        classificationFilter === '全部' || link.category === classificationFilter;
      const matchesTag = tagFilter === '全部' || link.tags.includes(tagFilter);
      return matchesClassification && matchesTag;
    });
  }, [links, classificationFilter, tagFilter]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-yellow-200 flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="h-20 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-6 lg:pr-8 relative flex items-center justify-between lg:justify-end">
          <div className="lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-64 lg:flex lg:items-center lg:justify-center">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { setEditingLink(null); setIsModalOpen(true); }}
              className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新增链接</span>
            </button>
          </div>
        </div>
      </nav>

      <CategorySidebar
        classifications={classifications}
        activeClassification={classificationFilter}
        onSelectClassification={setClassificationFilter}
        onDeleteClassification={(classification) =>
          requestAuth({ type: 'DELETE_CLASSIFICATION', payload: classification })
        }
      />

      <main className="w-full px-6 pt-28 pb-20 flex-grow lg:pl-[18.5rem]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">
              闪链・一键保存优质链接
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl">
              极简导航・开放共享
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-10 overflow-x-auto pb-3">
            <button
              onClick={() => setTagFilter('全部')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                tagFilter === '全部'
                  ? 'bg-yellow-400 text-white shadow-[0_4px_15px_rgba(250,204,21,0.4)]'
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-yellow-200 hover:text-yellow-500'
              }`}
            >
              #全部
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setTagFilter(tag)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                  tagFilter === tag
                    ? 'bg-yellow-400 text-white shadow-[0_4px_15px_rgba(250,204,21,0.4)]'
                    : 'bg-white text-gray-500 border border-gray-100 hover:border-yellow-200 hover:text-yellow-500'
                }`}
              >
                {formatTag(tag)}
              </button>
            ))}
          </div>

          {fatalError ? (
            <div className="text-center py-20 border-2 border-dashed border-red-200 rounded-3xl bg-red-50/40">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <X className="w-8 h-8" />
              </div>
              <h3 className="text-red-700 font-bold text-lg">配置错误</h3>
              <p className="text-red-600 mt-1 text-sm max-w-xl mx-auto">{fatalError}</p>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
            </div>
          ) : (
            <>
              {filteredLinks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredLinks.map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onEdit={() => requestAuth({ type: 'EDIT_LINK', payload: link })}
                      onDelete={() => requestAuth({ type: 'DELETE_LINK', payload: link })}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-gray-900 font-bold text-lg">未找到链接</h3>
                  <p className="text-gray-400 mt-1">尝试切换标签或分类，或添加新的链接。</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Main Form Modal */}
      <LinkModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLink}
        initialData={editingLink}
        tags={tags}
        classifications={classifications}
        onAddTag={executeAddTag}
        onDeleteTag={executeDeleteTag}
        onAddClassification={executeAddClassification}
        onDeleteClassification={(classification) =>
          requestAuth({ type: 'DELETE_CLASSIFICATION', payload: classification })
        }
      />
      
      {/* Security Pin Modal */}
      <PinModal 
        isOpen={isPinOpen} 
        onClose={() => setIsPinOpen(false)}
        onSuccess={handlePinSuccess}
      />
      
      <footer className="text-center py-8 text-gray-400 text-xs font-medium leading-relaxed bg-white/50 border-t border-gray-100">
        <p>Copyright © 2011-2026 WithMedia Co.Ltd all rights reserved</p>
        <p className="mt-1 opacity-70">内部使用 请勿外传</p>
      </footer>
    </div>
  );
}
