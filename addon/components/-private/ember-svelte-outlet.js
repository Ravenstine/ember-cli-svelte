import Ember from 'ember';
import Component from '@glimmer/component';
import { helper } from '@ember/component/helper';
import { getOwner } from '@ember/application';
import EmberSvelteComponent from '../../components/-private/ember-svelte-component';
import { SvelteComponent } from 'svelte/internal';

export default class EmberSvelteOutlet extends Component {
  getEmberSvelteComponent = helper(([outletState]) => {
    const routeName = outletState?.render?.name;
    const owner = getOwner(this);
    const templatePath = owner.__registry__.describe(
      `template:${routeName}.svelte`
    );

    if (!templatePath) return null;

    const { default: svelteComponentClass } =
      Ember.__loader.require(templatePath);

    if (svelteComponentClass.prototype instanceof SvelteComponent) {
      return class extends EmberSvelteComponent {
        constructor() {
          super(...arguments);

          this.outletState = outletState;
          this.svelteComponentClass = svelteComponentClass;
        }
      };
    }
  });
}
