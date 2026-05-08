import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getSupabaseClient, getSupabaseInitError } from '../lib/supabaseClient';
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
} from '../lib/linkMeta.js';
import {
  applyClassificationDeleteLocally,
  applyTagDeleteLocally,
  getBoardOption,
  normalizeSaveLinkData,
  withBoardValues,
} from '../lib/linkActions.js';

// Link state and Supabase CRUD orchestration live here; UI components stay data-source agnostic.
const supabaseInitError = getSupabaseInitError(USE_DEMO_MODE);

const createDemoLinks = () => [
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

export const useLinks = () => {
  const [links, setLinks] = useState([]);
  const [activeBoard, setActiveBoard] = useState(DEFAULT_BOARDS[0]);
  const [boardOptions, setBoardOptions] = useState(createDefaultBoardOptions);
  const [tagFilter, setTagFilter] = useState(ALL_FILTER);
  const [classificationFilter, setClassificationFilter] = useState(ALL_FILTER);
  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState(supabaseInitError);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const activeOptions = getBoardOption(boardOptions, activeBoard);
  const activeTags = activeOptions.tags;
  const activeClassifications = activeOptions.classifications;
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
    setLoading(true);

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
      if (data?.[0]) remoteApply(data[0]);
      return true;
    },
    [resolveSupabaseClient, showSupabaseError],
  );

  const requestAuth = useCallback((action) => {
    setPendingAction(action);
    setIsPinOpen(true);
  }, []);

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
        activeTags,
        activeClassifications,
      );
      return editingLink
        ? executeUpdateLink(normalizedLinkData, dbPayload)
        : executeCreateLink(normalizedLinkData, dbPayload);
    },
    [activeBoard, activeClassifications, activeTags, editingLink, executeCreateLink, executeUpdateLink],
  );

  const handlePinSuccess = useCallback(async () => {
    if (!pendingAction) return;
    const { type, payload } = pendingAction;
    if (type === PIN_ACTIONS.DELETE_LINK) {
      await executeDeleteLink(payload);
    } else if (type === PIN_ACTIONS.EDIT_LINK) {
      setEditingLink(payload);
      setIsModalOpen(true);
    } else if (type === PIN_ACTIONS.DELETE_CLASSIFICATION) {
      await executeDeleteClassification(payload);
    }
    setPendingAction(null);
  }, [executeDeleteClassification, executeDeleteLink, pendingAction]);

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
    return links.filter((link) => {
      const matchesBoard = link.board === activeBoard;
      const matchesClassification =
        deferredClassificationFilter === ALL_FILTER || link.category === deferredClassificationFilter;
      const matchesTag = deferredTagFilter === ALL_FILTER || link.tags.includes(deferredTagFilter);
      return matchesBoard && matchesClassification && matchesTag;
    });
  }, [activeBoard, deferredClassificationFilter, deferredTagFilter, links]);

  return {
    activeBoard,
    activeClassifications,
    activeTags,
    classificationFilter,
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
