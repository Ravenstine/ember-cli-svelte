import { getContext } from 'svelte';

export const EMBER_COMPONENT_CLASS = Symbol('EMBER_COMPONENT_CLASS');

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
