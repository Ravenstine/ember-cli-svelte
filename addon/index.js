import { getContext } from 'svelte';
import Shim from 'ember-cli-svelte/components/-private/ember-component-shim.svelte';

export const EMBER_COMPONENT_NAME_OR_CLASS = Symbol('EMBER_COMPONENT_NAME_OR_CLASS');

/**
 * Performs a lookup on the Ember app owner
 * and shims components and helpers so they can
 * be used within a Svelte template.
 *
 * @param {String} fullName - (e.g. 'component:my-component')
 * @returns {*}
 */
export function lookup(fullName) {
  const owner = getContext('owner');

  if (!owner)
    throw new Error(
      'Expected an owner within Svelte component context but none found.'
    );

  return owner.lookup(fullName);
}

/**
 * Performs a lookup on the Ember app owner
 * and shims components and helpers so they can
 * be used within a Svelte template.
 *
 * @param {String} fullName - (e.g. 'component:my-component')
 * @returns {*}
 */
export function resolveRegistration(fullName) {
  const owner = getContext('owner');

  if (!owner)
    throw new Error(
      'Expected an owner within Svelte component context but none found.'
    );

  const application = owner.lookup('application:main');
  const resolver = owner.lookup('resolver:main');
  const originalNamespace = resolver.namespace;

  resolver.namespace = application.modulePrefix;

  const parsedName = resolver.parseName(fullName);

  resolver.namespace = originalNamespace;

  if (!parsedName) return null;

  return owner.resolveRegistration(fullName);
}

/**
 * Takes either a registered component name or a valid Ember/Glimmer component
 * class and wraps it in a Svelte component that can be used to invoke it
 *
 * @param {string|class} nameOrClass
 **/
export function component(nameOrClass) {
  return class extends Shim {
    constructor(params) {
      const props = {
        ...(params.props || {}),
        [EMBER_COMPONENT_NAME_OR_CLASS]: nameOrClass,
      };

      super({
        ...params,
        props,
      });
    }
  };
}
