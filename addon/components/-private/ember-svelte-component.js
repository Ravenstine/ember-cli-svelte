import GlimmerComponent from '@glimmer/component';
import SvelteContent from 'ember-cli-svelte/components/-private/svelte-content';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { ensureSafeComponent } from '@embroider/util';
import { detach, flush, insert, noop } from 'svelte/internal';

class EmberSvelteComponent extends GlimmerComponent {
  svelteComponentClass;

  #args = {};
  #component;
  #startBound;
  #endBound;

  @tracked _showStartBound = true;
  @tracked _showEndBound = true;

  get svelteContent() {
    return ensureSafeComponent(SvelteContent, this);
  }

  constructor(owner, args) {
    super(...arguments);

    this.#args = args;
  }

  @action
  getStartBound(element) {
    this.#startBound = element;

    this._showStartBound = false;
  }

  @action
  getEndBound(element) {
    this.#endBound = element;

    this._showEndBound = false;
  }

  @action
  insertSvelteComponent() {
    const fragment = new DocumentFragment();

    // These overrides are meant to overcome some
    // errors caused by the way that Glimmer handles
    // its rendered elements.
    fragment.removeChild = (child) => {
      child.remove?.();
    };

    fragment.insertBefore = (node, reference) => {
      const parent = (reference || {}).parentNode || fragment;
      DocumentFragment.prototype.insertBefore.apply(parent, [node, reference]);
    };

    Object.defineProperty(fragment, 'parentNode', {
      value: fragment,
    });

    const blockContent = ((startBound, endBound) => {
      const nodes = [];

      let currentNode = startBound.nextSibling;

      while (currentNode !== endBound) {
        nodes.push(currentNode);
        currentNode = currentNode.nextSibling;
      }

      return nodes;
    })(this.#startBound, this.#endBound);

    fragment.replaceChildren(...blockContent);

    this._showReference = false;

    let defaultSlotTarget;

    this.#component = new this.svelteComponentClass({
      // Doesn't seem to matter that the end-bound element
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
              c: noop,
              m(target, anchor) {
                defaultSlotTarget = target;

                insert(target, fragment, anchor);
              },
              d(detaching) {
                if (!detaching) return;

                const childNodes = Array.from(
                  defaultSlotTarget.childNodes || []
                );

                fragment.replaceChildren(...childNodes);

                detach(fragment);
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
