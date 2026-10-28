import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '@/App.vue';
import { setLocale } from '@/i18n';
import type { Entry, EntryLog } from '@/types';
import type { NasShellAnswer as ShellAnswer } from '@valeriogc/nas-base-app';

const entries: Entry[] = [
  {
    id: '1',
    title: 'Disk full',
    message: 'Only 2 GB left',
    source: 'storage',
    tone: 'error',
    at: 1_700_000_000_000,
    log: '/var/log/nas-os/install-test.log',
  },
  {
    id: '2',
    title: 'Backup done',
    message: 'All files saved',
    source: 'backup',
    tone: 'success',
    at: 1_700_000_100_000,
  },
  {
    id: '3',
    title: 'Slow request',
    message: 'Took 4 seconds',
    source: 'storage',
    tone: 'warning',
    at: 1_700_000_200_000,
    log: '/var/log/nas-os/warning.log',
  },
  {
    id: '4',
    title: 'Started',
    message: 'Service ready',
    source: 'api',
    tone: 'info',
    at: 1_700_000_300_000,
  },
];

let messageHandler: EventListener | undefined;
let originalParent: PropertyDescriptor | undefined;
const mounted: Array<ReturnType<typeof mount>> = [];

function sendMessage(
  origin: string,
  data: unknown,
  source: MessageEventSource | null = window.parent,
) {
  messageHandler?.({ origin, data, source } as MessageEvent);
}

type Asked = [type: string, notification?: string];

function answers(...replies: Array<(asked: Asked) => ShellAnswer>) {
  const asked: Asked[] = [];
  const postMessage = vi.fn(
    (message: { type: string; requestId?: string; notification?: string }) => {
      if (!message.requestId || message.type.endsWith('-result')) {
        return;
      }
      const call: Asked = [message.type, message.notification];
      asked.push(call);
      const reply = (replies[asked.length - 1] ?? replies.at(-1))?.(call) ?? { success: true };
      void Promise.resolve().then(() =>
        sendMessage(window.location.origin, {
          nas: 1,
          type: `${message.type}-result`,
          requestId: message.requestId,
          ...reply,
        }),
      );
    },
  );
  Object.defineProperty(window, 'parent', { configurable: true, value: { postMessage } });
  return asked;
}

const listed = (): ShellAnswer => ({ success: true, data: entries });
const done = (): ShellAnswer => ({ success: true });
const logOf = (origin: string, lines: string[]) => (): ShellAnswer => ({
  success: true,
  data: { kind: 'file', origin, lines } satisfies EntryLog,
});

async function render(asked = answers(listed, done)) {
  const addListener = vi.spyOn(window, 'addEventListener');
  const wrapper = mount(App);
  mounted.push(wrapper);
  messageHandler = addListener.mock.calls.find(([type]) => type === 'message')?.[1] as
    EventListener | undefined;
  await flushPromises();
  return { wrapper, asked };
}

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    }),
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    }),
  });
  originalParent = Object.getOwnPropertyDescriptor(window, 'parent');
  setLocale('it');
  vi.stubGlobal('CSS', {
    supports: (property: string, value: string) =>
      property === 'color' && value === 'rebeccapurple',
  });
});
afterEach(() => {
  mounted.splice(0).forEach((wrapper) => wrapper.unmount());
  if (originalParent) {
    Object.defineProperty(window, 'parent', originalParent);
  }
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  messageHandler = undefined;
  document.documentElement.removeAttribute('lang');
  delete document.documentElement.dataset.theme;
  window.history.replaceState({}, '', '/apps/nas-log-manager/');
});

describe('notification dashboard', () => {
  it('loads entries and filters by tone and origin', async () => {
    const { wrapper, asked } = await render();
    expect(asked).toEqual([['diagnostics', undefined]]);
    expect(wrapper.text()).toContain('Disk full');
    expect(wrapper.findAll('tbody tr')).toHaveLength(2);
    expect(wrapper.text()).not.toContain('Backup done');
    expect(wrapper.text()).not.toContain('Started');
    const levels = wrapper.findAll('tbody .tone_icon').map((icon) => icon.classes());
    expect(levels).toHaveLength(2);
    expect(levels.flat()).toEqual(expect.arrayContaining(['tone_text_error', 'tone_text_warning']));

    await wrapper.findAll('nav button')[1].trigger('click');
    expect(wrapper.text()).toContain('Disk full');
    expect(wrapper.text()).not.toContain('Backup done');
    await wrapper.find('select#origin').setValue('storage');
    expect(wrapper.text()).toContain('Disk full');
    expect(wrapper.text()).not.toContain('Slow request');
    await wrapper.findAll('nav button')[0].trigger('click');
    expect(wrapper.text()).toContain('Disk full');
    expect(wrapper.text()).toContain('Slow request');
    expect(wrapper.text()).not.toContain('Backup done');
  });

  it('uses shell locale and labels, then asks the parent to describe loaded entries', async () => {
    const { wrapper } = await render();
    const ready = vi.spyOn(window.parent, 'postMessage');
    sendMessage(window.location.origin, {
      nas: 1,
      type: 'context',
      context: { app: 'nas-log-manager', locale: 'en', theme: 'dark', accent: 'rebeccapurple' },
    });
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('rebeccapurple');
    expect(ready).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'describe',
        notifications: entries.filter(
          (entry) => entry.tone === 'error' || entry.tone === 'warning',
        ),
      }),
      window.location.origin,
    );
    await flushPromises();
    expect(wrapper.get('nav button').text()).toBe('All');

    sendMessage(window.location.origin, {
      nas: 1,
      type: 'described',
      notifications: [{ id: '1', title: 'Storage', message: 'Almost full', source: 'Disco' }],
    });
    await flushPromises();
    expect(wrapper.text()).toContain('Storage');
    expect(wrapper.text()).toContain('Disco');
  });

  it('ignores untrusted parent messages and invalid shell contexts', async () => {
    const { wrapper } = await render();
    sendMessage(window.location.origin, { nas: 1, type: 'context', context: { locale: 'en' } });
    sendMessage('https://evil.example', {
      nas: 1,
      type: 'context',
      context: { locale: 'it', theme: 'dark' },
    });
    sendMessage(
      window.location.origin,
      { nas: 1, type: 'context', context: { locale: 'it' } },
      null,
    );
    expect(document.documentElement.lang).toBe('it');
    expect(wrapper.get('nav button').text()).toBe('Tutte');
  });

  it('shows what the shell refused, supports retry, and rejects a non-array answer', async () => {
    const { wrapper } = await render(
      answers(
        () => ({ success: false, error: 'offline' }),
        () => ({ success: false, error: 'malformed' }),
        () => ({ success: true, data: { unexpected: true } }),
      ),
    );
    expect(wrapper.get('[role="alert"]').text()).toBe('offline');
    await wrapper.find('button.refresh').trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe('malformed');
    await wrapper.find('button.refresh').trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toContain('Risposta');
  });

  it('locks the refresh and the origin filter while there are no logs', async () => {
    const { wrapper } = await render(answers(() => ({ success: true, data: [] })));

    expect(wrapper.get('button.refresh').attributes('disabled')).toBeDefined();
    expect(wrapper.get('select#origin').attributes('disabled')).toBeDefined();
  });

  it('keeps the origin under its heading and the actions at the end of the row', async () => {
    const { wrapper } = await render();
    const headings = wrapper.findAll('thead th').map((cell) => cell.text());
    const cells = wrapper.findAll('tbody tr')[0].findAll('td');

    expect(headings.slice(0, 3)).toEqual(['Ora', 'Titolo', 'Origine']);
    expect(cells).toHaveLength(headings.length);
    expect(cells[2].text()).toBe('storage');
    expect(cells.at(-1)?.find('.details_button').text()).toBe('Dettagli');
    expect(cells.at(-1)?.find('.delete_button').exists()).toBe(true);
  });

  it('says the launcher is unavailable outside its frame', async () => {
    Object.defineProperty(window, 'parent', { configurable: true, value: window });
    const { wrapper } = await render([]);
    expect(wrapper.get('[role="alert"]').text()).toBe('Launcher unavailable');
  });

  it('loads and closes explicitly linked diagnostic files', async () => {
    const { wrapper, asked } = await render(
      answers(
        listed,
        logOf('/var/log/app.log', ['first', 'second']),
        logOf('/var/log/nas-os/warning.log', []),
      ),
    );
    await wrapper.findAll('.details_button')[0].trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('/var/log/app.log');
    expect(wrapper.text()).toContain('first');
    expect(asked[1]).toEqual(['diagnostic-log', '1']);
    await wrapper.findAll('.details_button')[1].trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('/var/log/nas-os/warning.log');
    expect(wrapper.text()).toContain('Nessun dettaglio');
    await wrapper.find('button.close').trigger('click');
    expect(wrapper.find('.detail_card').exists()).toBe(false);
  });

  it('opens the notification the launcher asked for only when it has a log', async () => {
    window.history.replaceState({}, '', '/apps/nas-log-manager/?notification=3');
    const opened = await render(answers(listed, logOf('/var/log/nas-os/warning.log', ['line'])));
    expect(opened.asked[1]).toEqual(['diagnostic-log', '3']);
    expect(opened.wrapper.text()).toContain('/var/log/nas-os/warning.log');
    opened.wrapper.unmount();

    const bare: Entry = { ...entries[2]!, id: '5', log: null };
    window.history.replaceState({}, '', '/apps/nas-log-manager/?notification=5');
    const { wrapper, asked } = await render(
      answers(() => ({ success: true, data: [...entries, bare] })),
    );
    expect(asked.map(([type]) => type)).not.toContain('diagnostic-log');
    expect(wrapper.find('.detail_card').exists()).toBe(false);
  });

  it('deletes one entry and closes its open diagnostic detail', async () => {
    const { wrapper, asked } = await render(
      answers(listed, logOf('/var/log/app.log', ['failure']), done),
    );
    await wrapper.findAll('.details_button')[0].trigger('click');
    await flushPromises();
    await wrapper.findAll('.delete_button')[0].trigger('click');
    await flushPromises();

    expect(asked).toContainEqual(['remove-diagnostic', '1']);
    expect(wrapper.text()).not.toContain('Disk full');
    expect(wrapper.find('.detail_card').exists()).toBe(false);
  });

  it('deletes only the entries selected by the active filters', async () => {
    const { wrapper, asked } = await render();
    await wrapper.findAll('nav button')[2].trigger('click');
    expect(wrapper.get('button.delete_all').text()).toContain('Elimina avvisi');
    await wrapper.get('button.delete_all').trigger('click');
    await flushPromises();

    expect(asked).toContainEqual(['remove-diagnostic', '3']);
    expect(asked).not.toContainEqual(['remove-diagnostic', '1']);
    expect(wrapper.text()).not.toContain('Slow request');
  });

  it('shows why a log is unavailable and closes selection when its filters exclude it', async () => {
    const { wrapper } = await render(
      answers(listed, () => ({ success: false, error: 'log unavailable' })),
    );
    await wrapper.findAll('.details_button')[0].trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="alert"]').text()).toBe('log unavailable');
    await wrapper.findAll('nav button')[2].trigger('click');
    expect(wrapper.find('.detail_card').exists()).toBe(false);
  });

  it('refreshes on demand and uses English for URL language and theme', async () => {
    window.history.replaceState({}, '', '/apps/nas-log-manager/?lang=en&theme=dark');
    const { wrapper, asked } = await render();
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.theme).toBe('dark');
    await wrapper.find('button.refresh').trigger('click');
    await flushPromises();
    expect(asked).toEqual([
      ['diagnostics', undefined],
      ['diagnostics', undefined],
    ]);
    expect(wrapper.text()).toContain('Refresh');
  });
});
