import GlimmerComponent from '@glimmer/component';
import OptionalTag from 'ember-cli-svelte/components/-private/optional-tag';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { ensureSafeComponent } from '@embroider/util';
import { /*detach,*/ flush, /*insert,*/ noop } from 'svelte/internal';

class EmberSvelteComponent extends GlimmerComponent {
  svelteComponentClass;
  svelteComponentInstance;
  defaultSlotAnchor;

  @tracked defaultSlotElement;
  @tracked showsSvelteComponentAnchor = true;
  @tracked showsDefaultSlot = false;

  get svelteContent() {
    return ensureSafeComponent(OptionalTag, this);
  }

  @action
  insertSvelteComponent(svelteComponentAnchor) {
    this.svelteComponentInstance = new this.svelteComponentClass({
      // Doesn't seem to matter that the anchor element
      // gets removed by Glimmer after the Svelte component renders.
      anchor: svelteComponentAnchor,
      target: svelteComponentAnchor.parentElement,
      props: {
        ...this.args,
        $$scope: {},
        // See: https://github.com/sveltejs/svelte/issues/2588
        // This is here to support passing a block from the
        // Glimmer component to the default slot of the Svelte
        // component.
        $$slots: {
          default: [
            () => ({
              c: () => {
                this.showsSvelteComponentAnchor = false;
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
    const component = this.svelteComponentInstance;

    component.$set(this.args);

    flush();
  }

  @action
  teardownSvelteComponent() {
    this.svelteComponentInstance.$destroy();
  }
}

export default EmberSvelteComponent;
