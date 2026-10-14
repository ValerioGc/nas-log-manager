import { describe, expect, it } from 'vitest';
import { formatTemplate, formatTimestamp, getEntryText } from '@/utils/notificationDisplay';
import type { Described, Entry } from '@/types';

const entry: Entry = {
  id: 'disk-full',
  title: 'Disk full',
  message: 'Only 2 GB left',
  source: 'storage',
  tone: 'error',
  at: 1_700_000_000_000,
  read: false,
};

describe('notification display helpers', () => {
  it('uses launcher descriptions when available and falls back to the entry', () => {
    expect(getEntryText(entry, {})).toEqual({
      title: 'Disk full',
      message: 'Only 2 GB left',
    });

    const description: Described = {
      id: entry.id,
      title: 'Disco pieno',
      message: 'Restano solo 2 GB',
      source: 'Archivio',
    };
    expect(getEntryText(entry, { [entry.id]: description })).toEqual({
      title: 'Disco pieno',
      message: 'Restano solo 2 GB',
    });
  });

  it('interpolates known values and preserves placeholders without a value', () => {
    expect(formatTemplate('File {origin}, user {user}', { origin: '/var/log/app' })).toBe(
      'File /var/log/app, user {user}',
    );
  });

  it('formats timestamps using the requested locale', () => {
    expect(formatTimestamp(entry.at, 'en')).toBe(
      new Date(entry.at).toLocaleString('en', { dateStyle: 'short', timeStyle: 'medium' }),
    );
  });
});
