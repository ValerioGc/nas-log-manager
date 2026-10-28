import { defineComponent, ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { useNotifications } from '@/composables/useNotifications';
import { askNasShell } from '@/services/nasShell';
import type { Locale } from '@/i18n';
import type { Entry } from '@/types';

vi.mock('@/services/nasShell', async (original) => ({
  ...(await original<typeof import('@/services/nasShell')>()),
  askNasShell: vi.fn(),
}));

const entries: Entry[] = [
  {
    id: 'disk-full',
    title: 'Disk full',
    message: 'Only 2 GB left',
    source: 'storage',
    tone: 'error',
    at: 1_700_000_000_000,
  },
  {
    id: 'backup-done',
    title: 'Backup done',
    message: 'All files saved',
    source: 'backup',
    tone: 'success',
    at: 1_700_000_100_000,
  },
];

const Harness = defineComponent({
  setup() {
    return { ...useNotifications(ref<Locale>('it')) };
  },
  template: `
    <output>{{ entries.length }} / {{ visible.length }} / {{ count('error') }}</output>
    <button @click="tone = 'error'">Filter errors</button>
  `,
});

describe('useNotifications', () => {
  it('loads entries and derives the filtered list and tone counts', async () => {
    vi.mocked(askNasShell).mockResolvedValue(entries);

    const wrapper = mount(Harness);
    await flushPromises();
    expect(askNasShell).toHaveBeenCalledWith('diagnostics');
    expect(wrapper.get('output').text()).toBe('1 / 1 / 1');

    await wrapper.get('button').trigger('click');
    expect(wrapper.get('output').text()).toBe('1 / 1 / 1');
    wrapper.unmount();
  });
});
