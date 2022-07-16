<script>
  export let attributes, src, alt;

  let isLarge = false;

  $: classNames = `image ${isLarge ? 'large' : ''}`;

  function toggleSize() {
    isLarge = !isLarge;
  }
</script>

<button type="button" class={classNames} on:click={toggleSize}>
  <img {src} {alt} {...attributes}>
  <small>View {#if isLarge}Smaller{:else}Larger{/if}</small>
</button>
