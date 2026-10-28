import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppSidebar from '@/components/AppSidebar.vue';

describe('AppSidebar', () => {
  it('emits selected tone and origin changes', async () => {
    const wrapper = mount(AppSidebar, {
      props: {
        locale: 'it',
        tone: 'all',
        origin: '',
        origins: [{ source: 'storage', label: 'Archivio' }],
      },
    });

    await wrapper.get('button.nav_item').trigger('click');
    expect(wrapper.emitted('update:tone')?.[0]).toEqual(['all']);

    await wrapper.get('select#origin').setValue('storage');
    expect(wrapper.emitted('update:origin')?.[0]).toEqual(['storage']);
  });

  it('locks the origin filter while there are no logs', () => {
    const wrapper = mount(AppSidebar, {
      props: { locale: 'it', tone: 'all', origin: '', origins: [] },
    });

    expect(wrapper.get('select#origin').attributes('disabled')).toBeDefined();
  });

  it('shows an icon before each level, in the colour of the level', () => {
    const wrapper = mount(AppSidebar, {
      props: { locale: 'it', tone: 'all', origin: '', origins: [] },
    });

    const icons = wrapper.findAll('button.nav_item .app_icon');
    expect(icons).toHaveLength(3);
    expect(icons[0]!.classes()).not.toContain('tone_text_error');
    expect(icons[1]!.classes()).toContain('tone_text_error');
    expect(icons[2]!.classes()).toContain('tone_text_warning');
    for (const icon of icons) {
      expect(icon.attributes('style')).toContain('mask-image');
    }
  });
});
