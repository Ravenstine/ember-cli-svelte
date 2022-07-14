import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { getOwner } from '@ember/application';
import { action } from '@ember/object';
import { flush, noop } from 'svelte/internal';
import { helper } from '@ember/component/helper';
import { OWNER } from '@glimmer/owner';
import { getSvelteOptions } from 'ember-cli-svelte/lib/svelte-options';

export default class EmberSvelteComponent extends Component {
  svelteComponentClass;
  svelteComponentInstance;
  svelteComponentAnchor = new Comment();
  defaultSlotAnchor;

  @tracked defaultSlotElement;
  @tracked showsDefaultSlot = false;

  get argsValues() {
    const argsValues = [];

    for (const key in this.args) {
      argsValues.push(this.args[key]);
    }

    return argsValues;
  }

  get tagName() {
    const { tag } = getSvelteOptions(this.svelteComponentClass);

    return typeof tag === 'string' ? tag : '';
  }

  constructor(owner, args) {
    super(...arguments);

    if (args.svelteComponentClass)
      this.svelteComponentClass = args.svelteComponentClass;
  }

  @action
  insertSvelteComponent() {
    const owner = getOwner(this);

    this.svelteComponentInstance = new this.svelteComponentClass({
      // Doesn't seem to matter that the anchor element
      // gets removed by Glimmer after the Svelte component renders.
      anchor: this.svelteComponentAnchor,
      target: this.svelteComponentAnchor.parentElement,
      context: new Map([
        ['owner', owner],
        ['outletState', this.outletState || null],
      ]),
      props: {
        ...this.args,
        [OWNER]: owner,
        $$scope: {},
        // See: https://github.com/sveltejs/svelte/issues/2588
        // This is here to support passing a block from the
        // Glimmer component to the default slot of the Svelte
        // component.
        $$slots: {
          default: [
            () => ({
              c: noop,
              m: (target, anchor) => {
                this.defaultSlotElement = target;
                this.defaultSlotAnchor = anchor;
                this.showsDefaultSlot = true;
              },
              d: (detaching) => {
                if (!detaching) return;

                this.showsDefaultSlot = false;
              },
              l: noop,
            }),
          ],
        },
      },
    });

    flush();
  }

  @action
  updateSvelteComponent() {
    const component = this.svelteComponentInstance;

    component?.$set(this.args);

    flush();
  }

  updateSvelteComponentHelper = helper(() => {
    this.updateSvelteComponent();
  });

  @action
  teardownSvelteComponent() {
    this.svelteComponentInstance.$destroy();
  }
}
