<script>
  import { getContext, onMount, onDestroy } from 'svelte';
  import { getComponentTemplate } from '@ember/component';
  import { setOwner } from '@ember/application';
  import { EMBER_COMPONENT_NAME_OR_CLASS } from '../../index';
  import ShimView from './ember-component-shim-view';

  const props = arguments[1];

  let container, defaultBlockElement;
  let defaultBlockAnchor = new Comment();

  // This may be either a Glimmer component or a Classic component
  // We don't care.  It is just being passed to the shim view and
  // presumably the {{component}} helper will be able to handle it.
  const owner = getContext('owner');
  const layout = getComponentTemplate(ShimView);

  onMount(() => {
    const params = {
      layout,
      props,
      emberComponentNameOrClass: props[EMBER_COMPONENT_NAME_OR_CLASS],
      defaultBlockAnchor,
      defaultBlockElement,
    };

    setOwner(params, owner);

    let view = ShimView.create(params);

    view.renderer.appendTo(view, container);

    // const root = view.renderer._roots.find((root) => root.root === view);

    // Force a synchronous render of the
    // root definition for only this view.
    // Not strictly necessary but the
    // outcome seems preferable.
    // root.render();
  });

  onDestroy(() => {
    view.destroy();
  });
</script>

<div bind:this={container}>

</div>

<div bind:this={defaultBlockElement}>
  <slot></slot>
</div>