import { Plus, Search, X } from 'lucide-react';
import { CategorySidebar, MobileCategoryBar } from './components/CategorySidebar.jsx';
import { LinkCard } from './components/LinkCard.jsx';
import { LinkGridSkeleton } from './components/LinkGridSkeleton.jsx';
import { LinkModal } from './components/LinkModal.jsx';
import { Logo } from './components/Logo.jsx';
import { PinModal } from './components/PinModal.jsx';
import { useLinks } from './hooks/useLinks.js';
import { ALL_FILTER, DEFAULT_BOARDS } from './lib/constants.js';
import { formatTag } from './lib/linkMeta.js';

export default function App() {
  const {
    activeBoard,
    activeClassifications,
    activeTags,
    classificationFilter,
    displayClassifications,
    editingLink,
    executeAddClassification,
    executeAddTag,
    executeDeleteTag,
    fatalError,
    filteredLinks,
    handleCloseLinkModal,
    handleClosePinModal,
    handleDeleteClassificationRequest,
    handleDeleteLinkRequest,
    handleEditLinkRequest,
    handleOpenCreateModal,
    handleOpenLink,
    handlePinSuccess,
    handleSaveLink,
    handleSelectBoard,
    handleSelectClassificationFilter,
    handleSelectTagFilter,
    isModalOpen,
    isPinOpen,
    loading,
    tagFilter,
  } = useLinks();

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 font-sans selection:bg-brand-200 selection:text-brand-foreground flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="h-20 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-6 lg:pr-8 relative flex items-center justify-between lg:justify-end">
          <div className="lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2 lg:w-64 lg:flex lg:items-center lg:justify-center">
            <Logo />
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="新增链接"
              onClick={handleOpenCreateModal}
              className="bg-gray-900 hover:bg-gray-950 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-[background-color,box-shadow,transform] hover:shadow-[0_4px_20px_-5px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">新增链接</span>
            </button>
          </div>
        </div>
      </nav>

      <CategorySidebar
        classifications={displayClassifications}
        activeClassification={classificationFilter}
        onSelectClassification={handleSelectClassificationFilter}
        onDeleteClassification={handleDeleteClassificationRequest}
      />

      <main className="w-full px-6 pt-28 pb-20 flex-grow lg:pl-[18.5rem]">
        <div className="max-w-7xl mx-auto">
          <MobileCategoryBar
            classifications={displayClassifications}
            activeClassification={classificationFilter}
            onSelectClassification={handleSelectClassificationFilter}
          />

          <div className="mb-6 flex items-center gap-2">
            {DEFAULT_BOARDS.map((board) => (
              <button
                key={board}
                type="button"
                onClick={() => handleSelectBoard(board)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  activeBoard === board
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-100 hover:border-brand-200 hover:text-brand-text'
                }`}
              >
                {board}
              </button>
            ))}
          </div>

          <div className="mb-10 text-center sm:text-left">
            <h1 className="font-display text-xl sm:text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
              闪链・一键直达优质链接
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl">
              极简导航・开放共享
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-10 overflow-x-auto pb-3">
            <button
              type="button"
              onClick={() => handleSelectTagFilter(ALL_FILTER)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${
                tagFilter === ALL_FILTER
                  ? 'bg-brand text-white shadow-[0_4px_15px_rgba(255,208,0,0.4)]'
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-brand-200 hover:text-brand-text'
              }`}
            >
              #全部
            </button>
            {activeTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectTagFilter(tag)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${
                  tagFilter === tag
                    ? 'bg-brand text-white shadow-[0_4px_15px_rgba(255,208,0,0.4)]'
                    : 'bg-white text-gray-500 border border-gray-100 hover:border-brand-200 hover:text-brand-text'
                }`}
              >
                {formatTag(tag)}
              </button>
            ))}
          </div>

          {fatalError ? (
            <div className="text-center py-20 border-2 border-dashed border-red-200 rounded-3xl bg-red-50/40">
              <div className="size-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                <X aria-hidden="true" className="size-8" />
              </div>
              <h3 className="text-red-700 font-semibold text-lg">配置错误</h3>
              <p className="text-red-600 mt-1 text-sm max-w-xl mx-auto">{fatalError}</p>
            </div>
          ) : loading ? (
            <LinkGridSkeleton />
          ) : (
            <>
              {filteredLinks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredLinks.map((link) => (
                    <LinkCard
                      key={link.id}
                      link={link}
                      onEdit={handleEditLinkRequest}
                      onDelete={handleDeleteLinkRequest}
                      onOpen={handleOpenLink}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
                  <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Search aria-hidden="true" className="size-8" />
                  </div>
                  <h3 className="text-gray-900 font-semibold text-lg">未找到链接</h3>
                  <p className="text-gray-400 mt-1">尝试切换标签或分类，或添加新的链接。</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <LinkModal
        isOpen={isModalOpen}
        onClose={handleCloseLinkModal}
        onSave={handleSaveLink}
        initialData={editingLink}
        tags={activeTags}
        classifications={activeClassifications}
        onAddTag={executeAddTag}
        onDeleteTag={executeDeleteTag}
        onAddClassification={executeAddClassification}
        onDeleteClassification={handleDeleteClassificationRequest}
      />

      <PinModal
        isOpen={isPinOpen}
        onClose={handleClosePinModal}
        onSuccess={handlePinSuccess}
      />

      <footer className="text-center py-8 text-gray-400 text-xs font-medium leading-relaxed bg-white/50 border-t border-gray-100">
        <p>Copyright © <span className="font-mono">2011-2026</span> WithMedia Co.Ltd all rights reserved</p>
        <p className="mt-1 opacity-70">内部使用 请勿外传</p>
      </footer>
    </div>
  );
}
