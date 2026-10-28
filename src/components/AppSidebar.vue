<script setup lang="ts">

import { computed } from 'vue';
import { messages } from '@/i18n';
import type { AppSidebarEmits, AppSidebarProps, ToneFilter } from '@/types';
import { NasIcon } from '@valeriogc/nas-base-app';

import error from '@/assets/icons/error.svg?url';
import logs from '@/assets/icons/logs.svg?url';
import warning from '@/assets/icons/warning.svg?url';

const TONES: ToneFilter[] = ['all', 'error', 'warning'];
const ICONS: Record<ToneFilter, string> = { all: logs, error, warning };

const props = defineProps<AppSidebarProps>();
const emit = defineEmits<AppSidebarEmits>();

const t = computed(() => messages[props.locale]);

</script>

<template>
  <aside class="sidebar" :aria-label="t.type">
    <nav>
      <button
        v-for="item in TONES"
        :key="item"
        type="button"
        :class="['nav_item', { active: props.tone === item }]"
        :aria-pressed="props.tone === item"
        @click="emit('update:tone', item)"
      >
        <NasIcon
          :svg="ICONS[item]"
          :class="['tone_icon', { [`tone_text_${item}`]: item !== 'all' }]"
        />
        {{ t.tones[item] }}
      </button>
    </nav>

    <label class="sidebar_label origin_label" for="origin">{{ t.origin }}</label>

    <select
      id="origin"
      class="origin"
      :value="props.origin"
      :disabled="!props.origins.length"
      @change="emit('update:origin', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ t.allOrigins }}</option>
      <option v-for="item in props.origins" :key="item.source" :value="item.source">
        {{ item.label }}
      </option>
    </select>

    <div class="sidebar_footer">{{ t.readOnly }}</div>
  </aside>
</template>

<style scoped lang="scss">

.sidebar {
  background: $nas_sidebar_background;
  color: $nas_sidebar_foreground;
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}

.sidebar_label {
  color: $nas_sidebar_muted;
  padding: 0 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 750;
}

.origin_label {
  display: block;
  margin-top: 28px;
}

.origin {
  margin: 10px 12px 0;
  padding: 9px 10px;
  border-radius: 9px;
  border: 1px solid var(--nas-border);
  background: var(--nas-sunken);
  color: $nas_sidebar_foreground;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

nav {
  display: grid;
  gap: 4px;
}

.nav_item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 0;
  background: transparent;
  color: #b8c9d7;
  padding: 12px;
  text-align: left;
  border-radius: 10px;
}

.nav_item:hover,
.nav_item.active {
  background: #29465b;
  color: white;
}

.nav_item.active {
  box-shadow: inset 3px 0 var(--accent);
}

.sidebar_footer {
  margin-top: auto;
  padding: 18px 12px 0;
  color: #91aabd;
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: $nas_mobile_breakpoint) {
  .sidebar {
    padding: 12px 16px;
    position: static;
    height: auto;
    flex: 0 0 auto;
  }

  .sidebar_label,
  .sidebar_footer {
    display: none;
  }

  nav {
    display: flex;
    overflow-x: auto;
  }

  .nav_item {
    white-space: nowrap;
  }

  .origin {
    margin: 8px 0 0;
    width: 100%;
  }
}

</style>
