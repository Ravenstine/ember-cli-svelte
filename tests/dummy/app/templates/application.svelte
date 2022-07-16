<script>
  import { component } from 'ember-cli-svelte';
  import Outlet from 'ember-cli-svelte/outlet.svelte';

  const NavBar = component('nav-bar');
</script>

<div class="container">
  <NavBar />
  <div class="body">
    <Outlet />
  </div>
</div>
