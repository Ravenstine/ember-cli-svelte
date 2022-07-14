import SvelteOutletView from 'ember-cli-svelte/lib/outlet-view';
import { hbs } from 'ember-cli-htmlbars';

export function initialize(application) {
  application.__registry__.register('view:-outlet', SvelteOutletView);
  application.__registry__.register(
    'template:-outlet',
    hbs`
      {{component "-private/ember-svelte-outlet"}}
    `
  );
}
