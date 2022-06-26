Ember CLI Svelte
=================

This *experimental* add-on makes it possible to use [Svelte](https://svelte.dev) components within your Ember.js application.

I whipped it together in an afternoon to test the feasibilty of the idea.  It is pre-alpha software and you should **only** use it **at your own risk** and with **extreme caution** in production.  There is no intent to support legacy versions of Ember.


## Compatibility

* Ember.js v3.24 or above
* Ember CLI v3.24 or above
* Node.js v12 or above


## Installation

```
ember install ember-cli-svelte
```


## Usage

Simply drop a `.svelte` file in `app/components`, and then you can call it in your templates just like a regular Glimmer component.

```html
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

```html
<div><h2>Hello, Tomster!</h2></div>
```

Since a Svelte component is doing its own rendering separate from Glimmer, it needs its own element when being invoked by Glimmer.  A `<div>` element is created automatically for that purpose.


## Features

Currently, the only available features are the ability to invoke Svelte components and to forward dynamic properties to them.

There is no support (yet) for things like using Svelte components are route templates, dependency injection and lookups, Typescript, invoking Glimmer components within Svelte components, FastBoot compatibility, etc.  The current state of this add-on is very basic.


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).
