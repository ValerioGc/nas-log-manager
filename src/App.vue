<script setup lang="ts">

import { computed } from 'vue';
import { useNasLauncherContext } from '@/composables/useNasLauncherContext';
import type { SummaryItem } from '@/types';

import AppHeader from '@/components/AppHeader.vue';
import AppSidebar from '@/components/AppSidebar.vue';
import AppView from '@/components/AppView.vue';

import { useNotifications } from '@/composables/useNotifications';

const { locale, t } = useNasLauncherContext();
const {
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
} = useNotifications(locale);

const summary = computed<SummaryItem[]>(() => [
  { label: t.value.shown, value: visible.value.length, class: '' },
  { label: t.value.errors, value: count('error'), class: 'tone_text_error' },
  { label: t.value.warnings, value: count('warning'), class: 'tone_text_warning' },
]);

const deleteLabel = computed(() =>
  tone.value === 'all' ? t.value.deleteAll : t.value.deleteTone[tone.value],
);

</script>

<template>
  <div class="app_shell app_surface">
    <AppSidebar v-model:tone="tone" v-model:origin="origin" :locale="locale" :origins="origins" />

    <main class="content">
      <AppHeader
        :overview="t.overview"
        :title="t.tones[tone]"
        :subtitle="t.subtitle"
        :refresh-label="t.refresh"
        :delete-label="deleteLabel"
        :loading="loading"
        :deleting="deleting"
        :can-delete="visible.length > 0"
        :can-refresh="entries.length > 0 || error !== ''"
        @refresh="refresh"
        @delete="removeVisible"
      />

      <div class="summary">
        <div v-for="(item, index) in summary" :key="index" class="app_panel">
          <span class="summary_label">{{ item.label }}</span>
          <strong :class="item.class">{{ item.value }}</strong>
        </div>
      </div>

      <AppView
        :entries="entries"
        :visible-entries="visible"
        :described="described"
        :source-labels="sourceLabels"
        :locale="locale"
        :selected-id="selected"
        :log="log"
        :log-loading="logLoading"
        :log-error="logError"
        :error="error"
        :loading="loading"
        :deleting-ids="deletingIds"
        @select="select"
        @close="close"
        @delete="remove"
      />
    </main>
  </div>
</template>

<style scoped lang="scss">

.app_shell {
  height: 100vh;
  display: grid;
  grid-template-columns: 228px minmax(0, 1fr);
  overflow: hidden;
}

.content {
  padding: 42px clamp(20px, 4vw, 64px);
  max-width: 1500px;
  width: 100%;
  height: 100vh;
  overflow-y: auto;
}

.summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 34px 0 24px;

  > div {
    min-height: 106px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &_label {
    @extend %nas_muted_text;
    font-size: 13px;
  }

  strong {
    font-size: 28px;
  }
}

@media (max-width: $nas_mobile_breakpoint) {
  .app_shell {
    display: flex;
    flex-direction: column;
  }

  .content {
    padding: 26px 16px;
    height: auto;
    min-height: 0;
    flex: 1;
  }

  .summary {
    gap: 8px;

    > div {
      padding: 14px;
      min-height: 90px;
    }
  }
}

</style>
