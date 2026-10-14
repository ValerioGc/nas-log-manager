import { computed, onMounted, onUnmounted, ref, toRaw, watch, type Ref } from 'vue';
import { messages, type Locale } from '@/i18n';
import type { Described, Entry, EntryLog, Tone, ToneFilter } from '@/types';
import { askNasShell, describeNasNotifications, listenNasShell } from '@/services/nasShell';

export function useNotifications(locale: Ref<Locale>) {
  const entries = ref<Entry[]>([]);
  const described = ref<Record<string, Described>>({});
  const tone = ref<ToneFilter>('all');
  const origin = ref('');
  const selected = ref<string | null>(null);
  const log = ref<EntryLog | null>(null);
  const loading = ref(false);
  const deleting = ref(false);
  const deletingIds = ref<string[]>([]);
  const logLoading = ref(false);
  const error = ref('');
  const logError = ref('');
  const t = computed(() => messages[locale.value]);

  let stopShell: (() => void) | undefined;
  let timer: number | undefined;
  // Only the answer to the latest log asked for is shown: a slower earlier one is dropped.
  let logRequest = 0;

  // Opened from a notification of the launcher: the page is asked for that one.
  const requested = new URL(window.location.href).searchParams.get('notification');

  const sourceLabels = computed(() => {
    const labels: Record<string, string> = {};
    for (const entry of entries.value) {
      const label = described.value[entry.id]?.source;
      if (label) {
        labels[entry.source] = label;
      }
    }
    return labels;
  });

  const visible = computed(() =>
    entries.value.filter(
      (entry) =>
        (tone.value === 'all' || entry.tone === tone.value) &&
        (!origin.value || entry.source === origin.value),
    ),
  );

  const origins = computed(() =>
    [...new Set(entries.value.map((entry) => entry.source))]
      .map((source) => ({ source, label: sourceLabels.value[source] ?? source }))
      .sort((one, other) => one.label.localeCompare(other.label, locale.value)),
  );

  const count = (wanted: Tone) => entries.value.filter((entry) => entry.tone === wanted).length;

  function describe() {
    if (entries.value.length) {
      describeNasNotifications(toRaw(entries.value));
    }
  }

  watch(locale, describe);

  async function refresh() {
    loading.value = true;
    error.value = '';
    try {
      const data = await askNasShell<Entry[]>('diagnostics');
      if (!Array.isArray(data)) {
        throw new TypeError(t.value.invalidResponse);
      }

      entries.value = data.filter((entry) => entry.tone === 'warning' || entry.tone === 'error');
      describe();
      if (
        requested &&
        selected.value === null &&
        entries.value.some((entry) => entry.id === requested)
      ) {
        select(requested);
      }
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : t.value.genericError;
    } finally {
      loading.value = false;
    }
  }

  async function select(id: string) {
    selected.value = id;
    const asked = ++logRequest;

    log.value = null;
    logError.value = '';
    logLoading.value = true;
    try {
      const found = await askNasShell<EntryLog>('diagnostic-log', id);
      if (asked === logRequest) {
        log.value = found;
      }
    } catch (cause) {
      if (asked === logRequest) {
        logError.value = cause instanceof Error ? cause.message : t.value.genericError;
      }
    } finally {
      if (asked === logRequest) {
        logLoading.value = false;
      }
    }
  }

  async function remove(id: string) {
    if (deletingIds.value.includes(id)) {
      return false;
    }
    deletingIds.value = [...deletingIds.value, id];
    error.value = '';
    try {
      await askNasShell<null>('remove-diagnostic', id);
      entries.value = entries.value.filter((entry) => entry.id !== id);
      delete described.value[id];
      if (selected.value === id) {
        close();
      }
      return true;
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : t.value.genericDeleteError;
      return false;
    } finally {
      deletingIds.value = deletingIds.value.filter((entryId) => entryId !== id);
    }
  }

  async function removeVisible() {
    if (deleting.value || !visible.value.length) {
      return;
    }
    deleting.value = true;
    const ids = visible.value.map((entry) => entry.id);
    for (const id of ids) {
      if (!(await remove(id))) {
        break;
      }
    }
    deleting.value = false;
  }

  function close() {
    logRequest++;
    selected.value = null;
    log.value = null;
    logLoading.value = false;
  }

  watch([tone, origin], () => {
    if (selected.value && !visible.value.some((entry) => entry.id === selected.value)) {
      close();
    }
  });

  onMounted(() => {
    stopShell = listenNasShell((message) => {
      if (message.type === 'described') {
        described.value = Object.fromEntries(
          (message.notifications as Described[]).map((item) => [item.id, item]),
        );
      }
    });
    void refresh();
    timer = window.setInterval(() => void refresh(), 30_000);
  });

  onUnmounted(() => {
    logRequest++;
    stopShell?.();
    if (timer) {
      window.clearInterval(timer);
    }
  });

  return {
    close,
    count,
    deleting,
    deletingIds,
    described,
    entries,
    error,
    log,
    logError,
    logLoading,
    loading,
    origin,
    origins,
    refresh,
    remove,
    removeVisible,
    select,
    selected,
    sourceLabels,
    tone,
    visible,
  };
}
