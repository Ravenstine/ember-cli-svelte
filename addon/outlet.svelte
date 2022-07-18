<script>
  import Ember from 'ember';
  import { onMount, onDestroy, getContext } from 'svelte';
  import { setOwner } from '@ember/application';

  const owner = getContext('owner');
  const application = owner.lookup('application:main');
  const environment = owner.lookup('-environment:main');
  const template = owner.lookup('template:-outlet');
  const { OutletView } = Ember.__loader.require('@ember/-internals/glimmer/index');
  const params = {
    _environment: environment,
    environment,
    application,
    template,
  };

  setOwner(params, owner);

  const view = OutletView.create(params);
  const outletState = getContext('outletState');

  let anchor;
  let parentElement;
  let showAnchor = true;

  outletState.subscribe((state) => {
    if (state?.outlets?.main) {
      view.setOutletState(state.outlets.main);
    }
  });

  onMount(() => {
    parentElement = anchor.parentElement;
    showAnchor = false;

    view.appendTo(parentElement);
  });

  onDestroy(() => {
    if (view) view.destroy();
  });
</script>

{#if showAnchor}
  <span bind:this={anchor}></span>
{/if}
