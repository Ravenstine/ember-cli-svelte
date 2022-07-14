<script>
  import Outlet from 'ember-cli-svelte/outlet.svelte';
  import { lookup, EMBER_COMPONENT_CLASS } from 'ember-cli-svelte';

  // const Hello = lookup('component:hello');
  // const LinkTo = lookup('component:link-to');
  const TestThing = lookup('component:test-thing');
</script>

<!-- <Hello foo="bar">Flarppppp</Hello> -->

<!-- <LinkTo route="index">Flarp</LinkTo> -->
<!-- <Input type="number" value="foo" /> -->
<TestThing bar="baz" />

<h2>An outlet should be here</h2>

<Outlet />
