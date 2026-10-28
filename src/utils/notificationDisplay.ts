import type { Locale } from '../i18n';
import type { Described, Entry } from '../types';

export function getEntryText(entry: Entry, described: Record<string, Described>) {
  const translated = described[entry.id];
  return {
    title: translated?.title || entry.title,
    message: translated?.message || entry.message,
  };
}

export function formatTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] ?? match);
}

export function formatTimestamp(at: number, locale: Locale) {
  return new Date(at).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'medium' });
}
