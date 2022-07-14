Ember CLI Svelte
=================

**Cybernetically-enhance your ambitious web apps**

This *experimental* add-on makes it possible to use [Svelte](https://svelte.dev) components within your Ember.js application.


## Compatibility

* Ember.js v3.24 or above
* Ember CLI v3.24 or above
* Node.js v14 or above


## Installation

```
ember install ember-cli-svelte
```

The default blueprint will automatically modify your `app.js` file to use the extended resolver from this add-on instead of the default one from `ember-resolver`.

In other words, the import of your `app.js` will go from looking like this:

```javascript
import Resolver from 'ember-resolver';
```

to this:

```javascript
import Resolver from 'ember-cli-svelte/resolver';
```

The extended resolver is necessary to support the resolution of `.svelte` files.  In any case, you will need to use this resolver, so if you choose to use `npm install` instead of `ember install`, you must change this import by hand.

If you uninstall this add-on using `ember uninstall ember-cli-svelte`, your code will be reverted back to using `ember-resolver`.


## Usage

Simply drop a `.svelte` file in `app/components`, and then you can call it in your templates just like a regular Glimmer component.

```hbs
<!-- app/components/hello.svelte -->

<script>
  export let name;
</script>

<h2>Hello, {name}!</h2>
```

```hbs
{{!-- app/templates/application.hbs --}}

<Hello @name="Tomster" />
```

Outputs:

```hbs
<h2>Hello, Tomster!</h2>
```

Check out the [dummy](/tests/dummy) for more example usage.


### Svelte Component Imports

Svelte components can import and use other Svelte components just like you would expect.

```hbs
<!-- app/components/my-component.svelte -->

<script>
  import SomeOtherComponent from './some-other-component.svelte';
</script>

<SomeOtherComponent />
```

The inclusion of the `.svelte` file extension is both technically necessary and helps support existing Svelte component code.

Svelte component code is added individually to the build tree with the `.svelte.js` suffix.  Not only can they be imported in your Ember code just like any other module, but they are registered with the app and can be resolved that way.


### Block Content

Svelte components can also take block content and use it in a default slot.

```hbs
<!-- app/components/hello.svelte -->

<script>
  export let name;
</script>

<h2>Hello, {name}!</h2>
<h3><slot></slot></h3>
```

```hbs
{{!-- app/templates/application.hbs --}}

<Hello @name="Tomster">Meet Svelte</Hello>
```

Outputs:

```hbs
<h2>Hello, Tomster!</h2>
<h3>Meet Svelte</h3>
```

Block content can be dynamic and the Svelte component can even dynamically show/hide the slot.


### Lookups

Some convenience functions are provided for looking up and resolving objects from the Ember app.

```hbs
<script>
  import { lookup } from 'ember-cli-svelte';

  const routerService = lookup('service:router');
</script>
```


### Context

Within a Svelte component, you can access the Ember app owner object via the `getContext` API.

```hbs
<!-- app/components/my-component.svelte -->

<script>
  import { getContext } from 'svelte';

  const owner = getContext('owner');
  const router = owner.lookup('service:router');

  function goToDetails() {
    router.transitionTo('details');
  }
</script>

<button on:click={goToDetails}>Show Details</button>
```

Any Svelte components that are invoked by another Svelte component will automatically inherit this context.


### Route Templates

You can even use `.svelte` files for your route templates under `app/templates`.  The `model` and the `controller` for the route are passed in as props.

```hbs
<!-- app/templates/my-route.svelte -->

<script>
  export let model, controller;
</script>
```

To render an outlet, use the `Outlet` component that comes with the add-on.

```hbs
<!-- app/templates/application.svelte -->

<script>
  import Outlet from 'ember-cli-svelte/components/outlet.svelte';
</script>

<Outlet />
```

Both the Glimmer `{{outlet}}` and Svelte `<Outlet />` component behave in the same way and can render both Glimmer and Svelte templates.

Named outlets are not supported because they are no longer encouraged and will eventually be [deprecated](https://github.com/emberjs/rfcs/blob/master/text/0418-deprecate-route-render-methods.md).


### Ember Components

You can also invoke Ember/Glimmer components from within a Svelte component.  This must be done by using the `component` function:

```hbs
<script>
  import { component } from 'ember-cli-svelte';

  const MyComponent = component('my-component');
</script>

<MyComponent />
```


## Notes

This add-on is not compatible with FastBoot.  It remains to be seen whether it will ever be fully compatible with FastBoot.  Typescript inside Svelte components also is not yet suppoorted.


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).
