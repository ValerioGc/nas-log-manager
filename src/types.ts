import type { Locale } from './i18n';

/** How serious a notification is. */
export type Tone = 'info' | 'success' | 'warning' | 'error';

/** Tone filter exposed by the sidebar. */
export type ToneFilter = 'all' | 'warning' | 'error';

/** An origin and its localized label for the origin selector. */
export interface OriginOption {
  source: string;
  label: string;
}

/** One notification of the launcher, as its API gives it. */
export interface Entry {
  id: string;
  title: string;
  message: string;
  source: string;
  tone: Tone;
  at: number;
  read: boolean;
  key?: string | null;
  params?: Record<string, string>;
  log?: string | null;
}

/** The same notification in the language of the shell, when the shell says it. */
export interface Described {
  id: string;
  title: string;
  message: string;
  source: string;
}

/** An explicitly linked diagnostic log file. */
export interface EntryLog {
  kind: 'file';
  origin: string;
  lines: string[];
}

export interface AppHeaderProps {
  overview: string;
  title: string;
  subtitle: string;
  refreshLabel: string;
  deleteLabel: string;
  loading: boolean;
  deleting: boolean;
  canDelete: boolean;
  /** Off while there is nothing to refresh: no entries and no failure to retry. */
  canRefresh: boolean;
}

export interface AppHeaderEmits {
  refresh: [];
  delete: [];
}

export interface AppSidebarProps {
  locale: Locale;
  tone: ToneFilter;
  origin: string;
  origins: OriginOption[];
}

export interface AppSidebarEmits {
  'update:tone': [tone: ToneFilter];
  'update:origin': [origin: string];
}

export interface AppViewProps {
  entries: Entry[];
  visibleEntries: Entry[];
  described: Record<string, Described>;
  sourceLabels: Record<string, string>;
  locale: Locale;
  selectedId: string | null;
  log: EntryLog | null;
  logLoading: boolean;
  logError: string;
  error: string;
  loading: boolean;
  deletingIds: string[];
}

export interface AppViewEmits {
  select: [id: string];
  close: [];
  delete: [id: string];
}

export interface SummaryItem {
  label: string;
  value: number;
  class: string;
}
