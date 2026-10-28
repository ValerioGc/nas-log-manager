import type { Locale } from './i18n';

export type Tone = 'info' | 'success' | 'warning' | 'error';

export type Level = Extract<Tone, 'warning' | 'error'>;

export type ToneFilter = 'all' | Level;

export interface OriginOption {
  source: string;
  label: string;
}

/** Launcher notification as returned by the diagnostics request */
export interface Entry {
  id: string;
  title: string;
  message: string;
  source: string;
  tone: Tone;
  at: number;
  key?: string | null;
  params?: Record<string, string>;
  log?: string | null;
}

/** Notification kept by the viewer, only warnings and errors */
export interface Diagnostic extends Entry {
  tone: Level;
}

/** Notification text localized by the launcher shell */
export interface Described {
  id: string;
  title: string;
  message: string;
  source: string;
}

/** Diagnostic log file linked to a notification */
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
  entries: Diagnostic[];
  visibleEntries: Diagnostic[];
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
