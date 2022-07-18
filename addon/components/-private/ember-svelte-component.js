import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { getOwner } from '@ember/application';
import { action } from '@ember/object';
import { flush, noop } from 'svelte/internal';
import { setOwner } from '@ember/application';
import { getSvelteOptions } from 'ember-cli-svelte/lib/svelte-options';
import { writable } from 'svelte/store';

export default class EmberSvelteComponent extends Component {
  svelteComponentClass;
  svelteComponentInstance;
  svelteComponentAnchor = new Comment();
  outletStateStore = writable();

  @tracked defaultSlotElement;
  @tracked defaultSlotAnchor;
  @tracked showsDefaultSlot = false;

  get frozenArgs() {
    return Object.freeze({ ...this.args });
  }

  get tagName() {
    const { tag } = getSvelteOptions(this.svelteComponentClass);

    return typeof tag === 'string' ? tag : '';
  }

  constructor(owner, args) {
    super(...arguments);

    if (args.svelteComponentClass) {
      if (typeof args.svelteComponentClass === 'string') {
        this.svelteComponentClass =
          owner.__registry__.fallback.resolver.resolve(
            `template:${args.svelteComponentClass}`
          );
      } else {
        this.svelteComponentClass = args.svelteComponentClass;
      }
    }
  }

  @action
  insertSvelteComponent([outletState]) {
    const owner = getOwner(this);

    this.outletStateStore.set(outletState);

    const props = {
      ...this.frozenArgs,
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
    };

    setOwner(props, owner);

    this.svelteComponentInstance = new this.svelteComponentClass({
      // Doesn't seem to matter that the anchor element
      // gets removed by Glimmer after the Svelte component renders.
      anchor: this.svelteComponentAnchor,
      target: this.svelteComponentAnchor.parentElement,
      context: new Map([
        ['owner', owner],
        ['outletState', this.outletStateStore || null],
      ]),
      props,
    });

    flush();
  }

  @action
  updateSvelteComponent([outletState]) {
    const component = this.svelteComponentInstance;

    this.outletStateStore.set(outletState);

    component?.$set(this.frozenArgs);

    flush();
  }
}
