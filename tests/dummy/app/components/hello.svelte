<script>
  $: showSlot = true;

  export let name;
</script>

<svelte:options tag="hello-ember" />

<h2>Hello, {name}!</h2>

{#if showSlot}
<h3><slot></slot></h3>
{/if}

<label for="toggle">Toggle</label>
<input name="toggle" type="checkbox" bind:checked={showSlot}>
