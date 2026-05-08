export const DEFAULT_TAGS = ['设计', '开发', '工具', '阅读', '灵感'];
export const DEFAULT_CLASSIFICATIONS = ['未分类'];
export const DEFAULT_BOARDS = ['网站', '页面'];
export const LINK_META_PREFIX = '__WINKS_META__';
export const APP_VERSION = 'v1.2.0';
export const USE_DEMO_MODE = import.meta.env?.VITE_DEMO_MODE === 'true';

// Frontend-only soft-auth PIN; see docs/30-decisions/adr-0002-frontend-pin-only-auth.md.
export const ADMIN_PIN = '5185';

// Sentinel for "no filter" in tag/classification filters.
export const ALL_FILTER = '全部';

export const PIN_ACTIONS = Object.freeze({
  DELETE_LINK: 'DELETE_LINK',
  EDIT_LINK: 'EDIT_LINK',
  DELETE_CLASSIFICATION: 'DELETE_CLASSIFICATION',
});
