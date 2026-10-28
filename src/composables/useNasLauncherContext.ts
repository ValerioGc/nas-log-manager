import { computed } from 'vue';
import { useNasLauncherContext as useLauncherContext } from '@valeriogc/nas-base-app';
import { locale, messages, setLocale } from '@/i18n';
import { shell } from '@/services/nasShell';

/** Launcher context bound to the app bridge and message catalogue */
export function useNasLauncherContext() {
  useLauncherContext({ shell, onLocaleChange: setLocale });
  const t = computed(() => messages[locale.value]);
  return { locale, t };
}
