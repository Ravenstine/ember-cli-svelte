import { GlimmerComponent } from './colocated-inherit.svelte';
import { action } from '@ember/object';
import { flush } from 'svelte/internal';

export default class ColocatedInherit extends GlimmerComponent {
  @action
  insertSvelteComponent() {
    super.insertSvelteComponent(...arguments);

    this.svelteComponentInstance.$set({ name: 'Tomster' });

    flush();
  }
}
