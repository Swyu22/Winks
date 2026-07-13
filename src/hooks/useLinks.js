import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSupabaseClient, getSupabaseInitError } from '../lib/supabaseClient.js';
import {
  ALL_FILTER,
  DEFAULT_BOARDS,
  DEFAULT_CLASSIFICATIONS,
  DEFAULT_TAGS,
  PIN_ACTIONS,
  USE_DEMO_MODE,
} from '../lib/constants.js';
import {
  buildBoardOptionsFromLinks,
  createDefaultBoardOptions,
  encodeLinkMeta,
  hydrateLink,
  isKnownBoard,
  normalizeName,
  normalizeTag,
  sortClassificationsUncategorizedLast,
} from '../lib/linkMeta.js';
import {
  applyClassificationDeleteLocally,
  applyTagDeleteLocally,
  getBoardOption,
  normalizeSaveLinkData,
  withBoardValues,
} from '../lib/linkActions.js';
import { readLinksCache, writeLinksCache } from '../lib/linksCache.js';

// Link state and Supabase CRUD orchestration live here; UI components stay data-source agnostic.
const supabaseInitError = getSupabaseInitError(USE_DEMO_MODE);
const linksCacheStorage = USE_DEMO_MODE || typeof localStorage === 'undefined' ? null : localStorage;

const createDemoLinks = () => [
  {
    id: 1,
    title: 'Supabase',
    url: 'https://supabase.com',
    description: '开源后端开发平台',
    category: encodeLinkMeta('开发', ['开发', '工具']),
    clicks: 42,
  },
  {
    id: 2,
    title: 'Tailwind CSS',
    url: 'https://tailwindcss.com',
    description: '原子化CSS框架',
    category: encodeLinkMeta('开发', ['开发', '设计']),
    clicks: 17,
  },
  {
    id: 3,
    title: 'Dribbble',
    url: 'https://dribbble.com',
    description: '设计作品灵感社区',
    category: encodeLinkMeta('设计', ['设计', '灵感']),
    clicks: 88,
  },
  {
    id: 4,
    title: 'Framer',
    url: 'https://framer.com',
    description: '交互网站设计工具',
    category: encodeLinkMeta('设计', ['设计', '工具']),
    clicks: 5,
  },
  {
    id: 5,
    title: 'Linear',
    url: 'https://linear.app',
    description: '产品研发协作工具',
    category: encodeLinkMeta('工具', ['工具']),
    clicks: 23,
  },
];

export const useLinks = () => {
  // Prime from the SWR cache so repeat visits render real content immediately
  // instead of a spinner; fetchLinks still revalidates and stays authoritative.
  const [links, setLinks] = useState(() => readLinksCache(linksCacheStorage) ?? []);
  const [activeBoard, setActiveBoard] = useState(DEFAULT_BOARDS[0]);
  const [boardOptions, setBoardOptions] = useState(() => {
    const cached = readLinksCache(linksCacheStorage);
    return cached ? buildBoardOptionsFromLinks(cached) : createDefaultBoardOptions();
  });
  const [tagFilter, setTagFilter] = useState(ALL_FILTER);
  const [classificationFilter, setClassificationFilter] = useState(ALL_FILTER);
  const [loading, setLoading] = useState(() => readLinksCache(linksCacheStorage) === null);
  const [fatalError, setFatalError] = useState(supabaseInitError);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const activeOptions = useMemo(
    () => getBoardOption(boardOptions, activeBoard),
    [activeBoard, boardOptions],
  );
  const activeTags = activeOptions.tags;
  // activeClassifications keeps 未分类 FIRST — it feeds business logic (delete-classification
  // orphan fallback, new-link default category). displayClassifications forces 未分类 LAST and is
  // used ONLY for sidebar rendering, so the "未分类 置底" rule never leaks into that logic.
  const activeClassifications = activeOptions.classifications;
  const displayClassifications = useMemo(
    () => sortClassificationsUncategorizedLast(activeOptions.classifications),
    [activeOptions.classifications],
  );
  const deferredTagFilter = useDeferredValue(tagFilter);
  const deferredClassificationFilter = useDeferredValue(classificationFilter);

  const showSupabaseError = useCallback((action, error) => {
    const message = error?.message || '未知错误';
    console.error(`${action}失败:`, message);
    alert(`${action}失败：${message}`);
  }, []);

  const resolveSupabaseClient = useCallback(
    async (actionForError) => {
      try {
        const client = await getSupabaseClient({ useDemoMode: USE_DEMO_MODE });
        if (!client) {
          alert(`Supabase 未初始化，无法${actionForError}。`);
        }
        return client;
      } catch (error) {
        showSupabaseError(actionForError, error);
        return null;
      }
    },
    [showSupabaseError],
  );

  const fetchLinks = useCallback(async () => {
    // No setLoading(true) here: initial loading is seeded from the cache presence, and
    // background revalidation / post-mutation resyncs must not flash a spinner over
    // already-rendered content.
    if (USE_DEMO_MODE) {
      const normalizedLinks = createDemoLinks().map((link) => hydrateLink(link));
      setLinks(normalizedLinks);
      setBoardOptions(buildBoardOptionsFromLinks(normalizedLinks));
      setFatalError('');
      setLoading(false);
      return;
    }

    if (supabaseInitError) {
      setFatalError(supabaseInitError);
      setLoading(false);
      return;
    }

    const client = await resolveSupabaseClient('加载数据');
    if (!client) {
      setFatalError('Supabase 初始化失败，请检查环境变量配置。');
      setLoading(false);
      return;
    }

    const { data, error } = await client
      .from('links')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showSupabaseError('加载数据', error);
    } else if (data) {
      const normalizedLinks = data.map((link) => hydrateLink(link));
      setLinks(normalizedLinks);
      setBoardOptions(buildBoardOptionsFromLinks(normalizedLinks));
      setFatalError('');
    }

    setLoading(false);
  }, [resolveSupabaseClient, showSupabaseError]);

  useEffect(() => {
    void fetchLinks();
  }, [fetchLinks]);

  // Persist the latest links (including click bumps and edits) to the SWR cache.
  useEffect(() => {
    writeLinksCache(linksCacheStorage, links);
  }, [links]);

  // On partial failure (some rows succeeded remotely, others didn't), we resync via fetchLinks
  // rather than mutating local from a partial set — keeping the UI authoritative on the server.
  const runBatchUpdate = useCallback(
    async (actionName, affectedLinks, buildPayload, applyLocal) => {
      if (USE_DEMO_MODE) {
        applyLocal();
        return true;
      }
      if (affectedLinks.length === 0) {
        applyLocal();
        return true;
      }
      const client = await resolveSupabaseClient(actionName);
      if (!client) return false;
      const settled = await Promise.allSettled(
        affectedLinks.map((link) =>
          client.from('links').update(buildPayload(link)).eq('id', link.id),
        ),
      );
      const firstFailure = settled.find(
        (r) => r.status === 'rejected' || r.value?.error,
      );
      if (firstFailure) {
        const err = firstFailure.reason || firstFailure.value?.error;
        showSupabaseError(actionName, err);
        // Partial remote success leaves local out of sync; resync from server.
        await fetchLinks();
        return false;
      }
      applyLocal();
      return true;
    },
    [fetchLinks, resolveSupabaseClient, showSupabaseError],
  );

  const runSingleMutation = useCallback(
    async (actionName, demoApply, dbOperation, remoteApply) => {
      if (USE_DEMO_MODE) {
        demoApply();
        return true;
      }
      const client = await resolveSupabaseClient(actionName);
      if (!client) return false;
      // dbOperation must end with `.select()` so data[0] is the saved row for hydration.
      const { data, error } = await dbOperation(client);
      if (error) {
        showSupabaseError(actionName, error);
        return false;
      }
      if (data?.[0]) {
        remoteApply(data[0]);
        return true;
      }
      // No error but no row returned (e.g. updating a row another client already deleted under
      // the open RLS): report failure and resync so the modal cannot claim a false success.
      showSupabaseError(actionName, new Error('目标记录不存在或未返回保存结果，请刷新后重试。'));
      await fetchLinks();
      return false;
    },
    [fetchLinks, resolveSupabaseClient, showSupabaseError],
  );

  const requestAuth = useCallback((action) => {
    setPendingAction(action);
    setIsPinOpen(true);
  }, []);

  // Best-effort, fire-and-forget click persistence. A public (non-PIN) action under the
  // open RLS model; tolerant if the `clicks` column hasn't been added yet so opening a
  // link never breaks. Read-modify-write race is acceptable per ADR-0002 threat model.
  const persistClick = useCallback(async (link) => {
    if (USE_DEMO_MODE) return;
    try {
      const client = await getSupabaseClient({ useDemoMode: USE_DEMO_MODE });
      if (!client) return;
      const { error } = await client
        .from('links')
        .update({ clicks: (link.clicks || 0) + 1 })
        .eq('id', link.id);
      if (error) console.warn('点击计数持久化失败:', error.message);
    } catch (error) {
      console.warn('点击计数持久化失败:', error?.message || error);
    }
  }, []);

  const handleOpenLink = useCallback(
    (link) => {
      setLinks((prev) =>
        prev.map((l) => (l.id === link.id ? { ...l, clicks: (l.clicks || 0) + 1 } : l)),
      );
      void persistClick(link);
    },
    [persistClick],
  );

  const applySavedLinkOptions = useCallback((link) => {
    setBoardOptions((prev) =>
      withBoardValues(prev, link.board, {
        tags: link.tags,
        classifications: [link.category],
      }),
    );
  }, []);

  const executeAddTag = useCallback(
    (newTag) => {
      const normalizedTag = normalizeTag(newTag);
      if (!normalizedTag) return null;
      if (!activeTags.includes(normalizedTag)) {
        setBoardOptions((prev) => withBoardValues(prev, activeBoard, { tags: [normalizedTag] }));
      }
      return normalizedTag;
    },
    [activeBoard, activeTags],
  );

  const executeDeleteTag = useCallback(
    async (tagToDelete) => {
      const normalizedTag = normalizeTag(tagToDelete);
      if (!activeTags.includes(normalizedTag)) return;
      if (activeTags.length <= 1) {
        alert('至少保留一个标签。');
        return;
      }
      const fallbackTag = activeTags.find((t) => t !== normalizedTag) || DEFAULT_TAGS[0];
      const affectedLinks = links.filter(
        (link) => link.board === activeBoard && link.tags.includes(normalizedTag),
      );
      const buildPayload = (link) => {
        const nextTags = link.tags.filter((t) => t !== normalizedTag);
        const safeTags = nextTags.length > 0 ? nextTags : [fallbackTag];
        return { category: encodeLinkMeta(link.category, safeTags, link.board) };
      };
      const applyLocal = () => {
        const { nextLinks, nextBoardOptions, nextEditingLink } = applyTagDeleteLocally(
          links,
          boardOptions,
          activeBoard,
          normalizedTag,
          fallbackTag,
          editingLink,
        );
        setLinks(nextLinks);
        setBoardOptions(nextBoardOptions);
        setEditingLink(nextEditingLink);
        setTagFilter((prev) => (prev === normalizedTag ? ALL_FILTER : prev));
      };
      await runBatchUpdate('删除标签', affectedLinks, buildPayload, applyLocal);
    },
    [activeBoard, activeTags, boardOptions, editingLink, links, runBatchUpdate],
  );

  const executeAddClassification = useCallback(
    (newClassification) => {
      const normalizedClassification = normalizeName(newClassification);
      if (!normalizedClassification) return null;
      if (!activeClassifications.includes(normalizedClassification)) {
        setBoardOptions((prev) =>
          withBoardValues(prev, activeBoard, { classifications: [normalizedClassification] }),
        );
      }
      return normalizedClassification;
    },
    [activeBoard, activeClassifications],
  );

  const executeDeleteClassification = useCallback(
    async (classificationToDelete) => {
      const normalizedClassification = normalizeName(classificationToDelete);
      if (!activeClassifications.includes(normalizedClassification)) return;
      if (activeClassifications.length <= 1) {
        alert('至少保留一个分类。');
        return;
      }
      const fallbackClassification =
        activeClassifications.find((c) => c !== normalizedClassification) || DEFAULT_CLASSIFICATIONS[0];
      const affectedLinks = links.filter(
        (link) => link.board === activeBoard && link.category === normalizedClassification,
      );
      const buildPayload = (link) => ({
        category: encodeLinkMeta(fallbackClassification, link.tags, link.board),
      });
      const applyLocal = () => {
        const { nextLinks, nextBoardOptions, nextEditingLink } = applyClassificationDeleteLocally(
          links,
          boardOptions,
          activeBoard,
          normalizedClassification,
          fallbackClassification,
          editingLink,
        );
        setLinks(nextLinks);
        setBoardOptions(nextBoardOptions);
        setEditingLink(nextEditingLink);
        setClassificationFilter((prev) => (prev === normalizedClassification ? ALL_FILTER : prev));
      };
      await runBatchUpdate('删除分类', affectedLinks, buildPayload, applyLocal);
    },
    [activeBoard, activeClassifications, boardOptions, editingLink, links, runBatchUpdate],
  );

  const executeDeleteLink = useCallback(
    async (linkToDelete) => {
      if (USE_DEMO_MODE) {
        setLinks((prev) => prev.filter((l) => l.id !== linkToDelete.id));
        return;
      }
      const client = await resolveSupabaseClient('删除链接');
      if (!client) return;
      const { error } = await client.from('links').delete().eq('id', linkToDelete.id);
      if (error) {
        showSupabaseError('删除链接', error);
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== linkToDelete.id));
    },
    [resolveSupabaseClient, showSupabaseError],
  );

  const executeUpdateLink = useCallback(
    (normalizedLinkData, dbPayload) =>
      runSingleMutation(
        '更新链接',
        () => {
          setLinks((prev) =>
            prev.map((l) => (l.id === editingLink.id ? { ...l, ...normalizedLinkData } : l)),
          );
          applySavedLinkOptions(normalizedLinkData);
        },
        (client) => client.from('links').update(dbPayload).eq('id', editingLink.id).select(),
        (raw) => {
          const hydrated = hydrateLink(raw);
          setLinks((prev) => prev.map((l) => (l.id === hydrated.id ? hydrated : l)));
          applySavedLinkOptions(hydrated);
        },
      ),
    [applySavedLinkOptions, editingLink, runSingleMutation],
  );

  const executeCreateLink = useCallback(
    (normalizedLinkData, dbPayload) => {
      const newLink = { ...normalizedLinkData, id: Date.now() };
      return runSingleMutation(
        '新增链接',
        () => {
          setLinks((prev) => [newLink, ...prev]);
          applySavedLinkOptions(normalizedLinkData);
        },
        (client) => client.from('links').insert([dbPayload]).select(),
        (raw) => {
          const hydrated = hydrateLink(raw);
          setLinks((prev) => [hydrated, ...prev]);
          applySavedLinkOptions(hydrated);
        },
      );
    },
    [applySavedLinkOptions, runSingleMutation],
  );

  const handleSaveLink = useCallback(
    async (linkData) => {
      const { normalizedLinkData, dbPayload } = normalizeSaveLinkData(
        linkData,
        editingLink,
        activeBoard,
        activeOptions.tags,
        activeOptions.classifications,
      );
      return editingLink
        ? executeUpdateLink(normalizedLinkData, dbPayload)
        : executeCreateLink(normalizedLinkData, dbPayload);
    },
    [activeBoard, activeOptions.classifications, activeOptions.tags, editingLink, executeCreateLink, executeUpdateLink],
  );

  const handlePinSuccess = useCallback(async () => {
    if (!pendingAction) return;
    const { type, payload } = pendingAction;
    if (type === PIN_ACTIONS.DELETE_LINK) {
      await executeDeleteLink(payload);
    } else if (type === PIN_ACTIONS.DELETE_TAG) {
      await executeDeleteTag(payload);
    } else if (type === PIN_ACTIONS.EDIT_LINK) {
      setEditingLink(payload);
      setIsModalOpen(true);
    } else if (type === PIN_ACTIONS.DELETE_CLASSIFICATION) {
      await executeDeleteClassification(payload);
    }
    setPendingAction(null);
  }, [executeDeleteClassification, executeDeleteLink, executeDeleteTag, pendingAction]);

  const handleSelectTagFilter = useCallback((nextTag) => {
    startTransition(() => {
      setTagFilter(nextTag);
    });
  }, []);

  const handleSelectClassificationFilter = useCallback((nextClassification) => {
    startTransition(() => {
      setClassificationFilter(nextClassification);
    });
  }, []);

  const handleSelectBoard = useCallback((nextBoard) => {
    if (!isKnownBoard(nextBoard)) return;
    startTransition(() => {
      setActiveBoard(nextBoard);
      setTagFilter(ALL_FILTER);
      setClassificationFilter(ALL_FILTER);
    });
  }, []);

  const handleDeleteClassificationRequest = useCallback(
    (classification) => {
      requestAuth({ type: PIN_ACTIONS.DELETE_CLASSIFICATION, payload: classification });
    },
    [requestAuth],
  );

  const handleDeleteTagRequest = useCallback(
    (tag) => {
      requestAuth({ type: PIN_ACTIONS.DELETE_TAG, payload: tag });
    },
    [requestAuth],
  );

  const handleEditLinkRequest = useCallback(
    (link) => {
      requestAuth({ type: PIN_ACTIONS.EDIT_LINK, payload: link });
    },
    [requestAuth],
  );

  const handleDeleteLinkRequest = useCallback(
    (link) => {
      requestAuth({ type: PIN_ACTIONS.DELETE_LINK, payload: link });
    },
    [requestAuth],
  );

  const handleOpenCreateModal = useCallback(() => {
    setEditingLink(null);
    setIsModalOpen(true);
  }, []);

  const handleCloseLinkModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleClosePinModal = useCallback(() => {
    setIsPinOpen(false);
    setPendingAction(null);
  }, []);

  const filteredLinks = useMemo(() => {
    const matches = links.filter((link) => {
      const matchesBoard = link.board === activeBoard;
      const matchesClassification =
        deferredClassificationFilter === ALL_FILTER || link.category === deferredClassificationFilter;
      const matchesTag = deferredTagFilter === ALL_FILTER || link.tags.includes(deferredTagFilter);
      return matchesBoard && matchesClassification && matchesTag;
    });
    // Popularity sort: most-clicked first, newest as a stable tie-breaker.
    return matches.sort((a, b) => {
      const byClicks = (b.clicks || 0) - (a.clicks || 0);
      if (byClicks !== 0) return byClicks;
      // Coerce to a finite number so an unparseable timestamp can't return NaN and
      // break the comparator's total order.
      const at = Date.parse(a.created_at);
      const bt = Date.parse(b.created_at);
      return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
    });
  }, [activeBoard, deferredClassificationFilter, deferredTagFilter, links]);

  return {
    activeBoard,
    activeClassifications,
    activeTags,
    classificationFilter,
    displayClassifications,
    executeAddClassification,
    executeAddTag,
    fatalError,
    filteredLinks,
    handleCloseLinkModal,
    handleClosePinModal,
    handleDeleteClassificationRequest,
    handleDeleteLinkRequest,
    handleDeleteTagRequest,
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
    editingLink,
  };
};
