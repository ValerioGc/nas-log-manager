import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppHeader from '@/components/AppHeader.vue';

describe('AppHeader', () => {
  it('emits refresh when enabled and disables repeated refresh while loading', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        overview: 'Registro',
        title: 'Errori',
        subtitle: 'Dettaglio',
        refreshLabel: 'Aggiorna',
        deleteLabel: 'Elimina tutti',
        loading: false,
        deleting: false,
        canDelete: true,
        canRefresh: true,
      },
    });

    await wrapper.get('button.refresh').trigger('click');
    expect(wrapper.emitted('refresh')).toHaveLength(1);

    await wrapper.get('button.delete_all').trigger('click');
    expect(wrapper.emitted('delete')).toHaveLength(1);

    await wrapper.setProps({ loading: true });
    expect(wrapper.get('button.refresh').attributes('disabled')).toBeDefined();

    await wrapper.setProps({ canDelete: false });
    expect(wrapper.get('button.delete_all').attributes('disabled')).toBeDefined();
  });

  it('offers no refresh while there is nothing to refresh', async () => {
    const wrapper = mount(AppHeader, {
      props: {
        overview: 'Registro',
        title: 'Errori',
        subtitle: 'Dettaglio',
        refreshLabel: 'Aggiorna',
        deleteLabel: 'Elimina tutti',
        loading: false,
        deleting: false,
        canDelete: false,
        canRefresh: false,
      },
    });

    expect(wrapper.get('button.refresh').attributes('disabled')).toBeDefined();
  });
});
