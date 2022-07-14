<script>
  import Ember from 'ember';
  import { onMount, onDestroy, getContext } from 'svelte';
  import { OWNER } from '@glimmer/owner';

  const owner = getContext('owner');
  const application = owner.lookup('application:main');
  const environment = owner.lookup('-environment:main');
  const template = owner.lookup('template:-outlet');
  const { OutletView } = Ember.__loader.require('@ember/-internals/glimmer/index');

  let element;
  let view;

  const outletState = getContext('outletState');

  onMount(() => {
    view = OutletView.create({
      environment,
      [OWNER]: owner,
      application,
      template,
    });

    if (outletState?.outlets?.main) {
      view.setOutletState(outletState.outlets.main);
    }

    view.appendTo(element);
  });

  onDestroy(() => {
    if (view) view.destroy();
  });
</script>

<div bind:this={element}></div>
