Ember CLI Svelte
=================

**Cybernetically-enhanced ambitious web apps**

This *experimental* add-on makes it possible to use [Svelte](https://svelte.dev) components within your Ember.js application.

I whipped it together in an afternoon to test the feasibilty of the idea.  It is pre-alpha software and you should **only** use it **at your own risk** and with **extreme caution** in production.  There is no intent to support legacy versions of Ember.


## Compatibility

* Ember.js v3.24 or above
* Ember CLI v3.24 or above
* Node.js v14 or above


## Installation

```
ember install ember-cli-svelte
```


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

Some monkey business is done behind the scenes to get this to work.  It has not been rigorously tested, but I haven't yet run into any issues testing it by hand.

A surrounding DOM element can be defined with the special `<svelte::options>` tag in your Svelte component:

```hbs
<svelte::options tag="hello-from-svelte">
```

This produces the following output with the component we've been working with here so far:

```hbs
<hello-from-svelte>
  <h2>Hello, Tomster!</h2>
  <h3>Meet Svelte</h3>
</hello-from-svelte>
```

Any attributes spread to the component invocation from Glimmer will be applied to the surrounding element if it is present.  Note that the tag option is static and cannot be changed during runtime.

Svelte components can import and use other Svelte components just like you would expect:

```hbs
<!-- app/components/my-component.svelte -->

<script>
  import SomeOtherComponent from './some-other-component.svelte';
</script>

<SomeOtherComponent />
```

The inclusion of the `.svelte` file extension is both technically necessary and helps support existing Svelte component code.

Svelte component code is added individually to the build tree with the `.svelte.js` suffix.  Not only can they be imported in your Ember code just like any other module, but they are registered with the app and can be resolved that way.

Be aware that if you have both a `.svelte` file and a `.hbs` file of the same component name, the `.svelte` one will take precedence and the `.hbs` template will be overwritten.  The same is true if you have a `.js` file with a conflicting name.

## Features

This add-on currently supports only very basic features:

- Invokes Svelte components in Glimmer/hbs templates
- Forwards the reactivity of passed props
- Supports passing block content to the default slot
- Attribute spread (if wrapping element is specified)

There is no support (yet) for things like using `.svelte` files for route templates, dependency injection and lookups, Typescript, invoking Glimmer components within Svelte components, FastBoot compatibility (this will be *hard*), etc.


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).
