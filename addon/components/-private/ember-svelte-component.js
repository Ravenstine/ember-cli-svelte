import GlimmerComponent from '@glimmer/component';
import OptionalTag from 'ember-cli-svelte/components/-private/optional-tag';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { ensureSafeComponent } from '@embroider/util';
import { /*detach,*/ flush, /*insert,*/ noop } from 'svelte/internal';

class EmberSvelteComponent extends GlimmerComponent {
  svelteComponentClass;
  defaultSlotAnchor;

  @tracked defaultSlotElement;
  @tracked showsDefaultSlot = false;
  @tracked showsAnchor = true;

  #args = {};
  #component;
  #endBound;

  get svelteContent() {
    return ensureSafeComponent(OptionalTag, this);
  }

  constructor(owner, args) {
    super(...arguments);

    this.#args = args;
  }

  @action
  getEndBound(element) {
    this.#endBound = element;

    this.showsAnchor = false;
  }

  @action
  insertSvelteComponent() {
    this._showReference = false;

    this.#component = new this.svelteComponentClass({
      // Doesn't seem to matter that the anchor element
      // gets removed by Glimmer after the Svelte component renders.
      anchor: this.#endBound,
      target: this.#endBound.parentElement,
      props: {
        ...this.#args,
        $$scope: {},
        // See: https://github.com/sveltejs/svelte/issues/2588
        // This is here to support passing a block from the
        // Glimmer component to the default slot of the Svelte
        // component.
        $$slots: {
          default: [
            () => ({
              c: () => {
                this.showsDefaultSlot = true;
              },
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
  }

  @action
  updateSvelteComponent() {
    const component = this.#component;

    component.$set(this.#args);

    flush();
  }

  @action
  teardownSvelteComponent() {
    this.#component.$destroy();
  }
}

export default EmberSvelteComponent;
