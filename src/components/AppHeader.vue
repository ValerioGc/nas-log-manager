<script setup lang="ts">

import { NasPageHeader } from '@valeriogc/nas-base-app';
import type { AppHeaderEmits, AppHeaderProps } from '@/types';

const props = defineProps<AppHeaderProps>();
const emit = defineEmits<AppHeaderEmits>();

</script>

<template>
  <NasPageHeader :overview="props.overview" :title="props.title" :subtitle="props.subtitle">
    <template #actions>
      <button
        class="delete_all"
        type="button"
        :disabled="props.loading || props.deleting || !props.canDelete"
        @click="emit('delete')"
      >
        <span class="delete_icon" aria-hidden="true"></span>
        {{ props.deleteLabel }}
      </button>
      <button
        class="refresh"
        type="button"
        :disabled="props.loading || props.deleting || !props.canRefresh"
        @click="emit('refresh')"
      >
        <span class="refresh_icon" aria-hidden="true"></span>
        {{ props.refreshLabel }}
      </button>
    </template>
  </NasPageHeader>
</template>

<style scoped lang="scss">

.page_header :deep(h1) {
  font-size: clamp(28px, 3vw, 38px);
  margin: 0;
  letter-spacing: -0.035em;
}

.refresh,
.delete_all {
  border: 1px solid var(--nas-border);
  border-radius: 9px;
  padding: 10px 16px;
  color: var(--nas-foreground);
  background: var(--nas-panel);
  white-space: nowrap;
}

.delete_all {
  color: var(--nas-error);
}

.refresh_icon,
.delete_icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: 0.2em;
  vertical-align: -0.12em;
  background: currentColor;
}

.refresh_icon {
  mask: url('../assets/icons/refresh.svg') center / contain no-repeat;
  -webkit-mask: url('../assets/icons/refresh.svg') center / contain no-repeat;
}

.delete_icon {
  mask: url('../assets/icons/delete.svg') center / contain no-repeat;
  -webkit-mask: url('../assets/icons/delete.svg') center / contain no-repeat;
}

</style>
