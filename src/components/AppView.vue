<script setup lang="ts">

import { computed } from 'vue';
import { NasIcon, NasModal } from '@valeriogc/nas-base-app';
import { messages } from '@/i18n';
import type { AppViewEmits, AppViewProps, Entry } from '@/types';
import { formatTemplate, formatTimestamp, getEntryText } from '@/utils/notificationDisplay';
import error from '@/assets/icons/error.svg?url';
import info from '@/assets/icons/info.svg?url';
import success from '@/assets/icons/success.svg?url';
import warning from '@/assets/icons/warning.svg?url';

const props = defineProps<AppViewProps>();
const emit = defineEmits<AppViewEmits>();

const t = computed(() => messages[props.locale]);
const selectedEntry = computed(() => props.entries.find((entry) => entry.id === props.selectedId));

const text = (entry: Entry) => getEntryText(entry, props.described);
const format = formatTemplate;
const time = (at: number) => formatTimestamp(at, props.locale);

const ICONS = { error, info, success, warning };

</script>

<template>
  <!-- The browser manages modality and keyboard navigation inside the dialog. -->
  <NasModal v-if="selectedEntry" :label="t.details" @close="emit('close')">
    <section class="app_panel detail_card">
      <div class="card_heading">
        <div>
          <h2>{{ text(selectedEntry).title }}</h2>
          <p class="detail_message">{{ text(selectedEntry).message }}</p>
          <small v-if="props.log">
            {{
              format(t.fromFile, {
                origin: props.log.origin,
              })
            }}
          </small>
        </div>
        <button type="button" class="close" autofocus :aria-label="t.close" @click="emit('close')">
          <span class="close_icon" aria-hidden="true"></span>
        </button>
      </div>

      <p v-if="props.logError" class="alert" role="alert">{{ props.logError }}</p>
      <output v-else-if="props.logLoading" class="empty">{{ t.logLoading }}</output>
      <p v-else-if="props.log && !props.log.lines.length" class="empty">{{ t.logEmpty }}</p>
      <pre v-else-if="props.log" class="log_lines">{{ props.log.lines.join('\n') }}</pre>
    </section>
  </NasModal>

  <section class="app_panel table_card" :aria-label="t.entries">
    <div class="card_heading">
      <h2>{{ t.entries }}</h2>
      <span>{{ props.visibleEntries.length }} {{ t.items }}</span>
    </div>

    <p v-if="props.error" class="alert" role="alert">{{ props.error }}</p>
    <output v-if="props.loading && !props.entries.length" class="empty">{{ t.loading }}</output>
    <p v-else-if="!props.visibleEntries.length && !props.error" class="empty">{{ t.empty }}</p>

    <div v-else class="table_scroll">
      <table>
        <thead>
          <tr>
            <th>{{ t.time }}</th>
            <th>{{ t.title }}</th>
            <th>{{ t.source }}</th>
            <th class="actions_column">
              <span class="sr_only">{{ t.actions }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in props.visibleEntries"
            :key="entry.id"
            :class="{ chosen: props.selectedId === entry.id }"
          >
            <td class="nowrap">{{ time(entry.at) }}</td>
            <td>
              <NasIcon :svg="ICONS[entry.tone]" :class="['tone_icon', `tone_text_${entry.tone}`]" />
              <span class="entry_title">
                {{ text(entry).title }}
              </span>
              <small>
                {{ text(entry).message }}
              </small>
            </td>
            <td>{{ props.sourceLabels[entry.source] ?? entry.source }}</td>
            <td class="actions_column">
              <div class="row_actions">
                <button
                  v-if="entry.log"
                  class="details_button"
                  type="button"
                  @click="emit('select', entry.id)"
                >
                  {{ t.details }}
                </button>
                <button
                  class="delete_button"
                  type="button"
                  :disabled="props.deletingIds.includes(entry.id)"
                  :aria-label="t.deleteOne"
                  :title="t.deleteOne"
                  @click="emit('delete', entry.id)"
                >
                  <span class="delete_icon" aria-hidden="true"></span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped lang="scss">

.table_card {
  overflow: hidden;
  margin-bottom: 24px;
}

.detail_card {
  width: min(760px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
}

.card_heading {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  border-bottom: 1px solid var(--nas-border);
  color: var(--nas-muted);
  font-size: 13px;
}

.card_heading h2 {
  color: var(--nas-foreground);
  font-size: 17px;
  margin: 0;
}

.detail_message {
  margin: 6px 0;
  color: var(--nas-muted);
}

.table_scroll {
  overflow-x: auto;
}

th {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--nas-muted);
  background: var(--nas-sunken);
}

th,
td {
  padding: 16px 24px;
  vertical-align: top;
}

td {
  font-size: 13px;
}

tr:last-child td {
  border-bottom: 0;
}

tr.chosen {
  background: var(--nas-hover);
}

.nowrap {
  white-space: nowrap;
}

.entry_title {
  font-weight: 650;
}

td small {
  display: block;
  color: var(--nas-muted);
  margin: 3px 0 0 19px;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.actions_column {
  width: 1%;
  white-space: nowrap;
}

.row_actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.close,
.delete_button {
  border: 0;
  background: transparent;
  color: var(--accent);
  font-weight: 650;
}

.details_button {
  padding: 6px 12px;
  border: 1px solid var(--nas-border);
  border-radius: 8px;
  background: var(--nas-panel);
  color: var(--accent);
  font-weight: 650;
  white-space: nowrap;
}

.delete_button {
  display: inline-grid;
  place-items: center;
  min-width: 32px;
  min-height: 32px;
  padding: 4px;
  color: var(--nas-error);
}

.delete_icon {
  display: block;
  width: 18px;
  height: 18px;
  background: currentColor;
  mask: url('../assets/icons/delete.svg') center / contain no-repeat;
  -webkit-mask: url('../assets/icons/delete.svg') center / contain no-repeat;
}

.details_button:hover {
  background: var(--nas-hover);
}

.close {
  display: inline-grid;
  min-width: 32px;
  min-height: 32px;
  place-items: center;
  padding: 2px;
}

.close_icon {
  display: block;
  width: 20px;
  height: 20px;
  background: currentColor;
  mask: url('../assets/icons/close.svg') center / contain no-repeat;
  -webkit-mask: url('../assets/icons/close.svg') center / contain no-repeat;
}

.empty,
.alert {
  display: block;
  margin: 0;
  padding: 48px 24px;
  text-align: center;
  color: var(--nas-muted);
}

.alert {
  color: var(--nas-error);
  background: color-mix(in srgb, var(--nas-error) 8%, var(--nas-panel));
}

.log_lines {
  margin: 0;
  padding: 18px 24px;
  max-height: 420px;
  overflow: auto;
  font:
    12px/1.6 ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
  background: #0f1d29;
  color: #d6e2ea;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.sr_only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

</style>
