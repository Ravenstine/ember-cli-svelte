import { valueForRef } from '@glimmer/reference';
import { track } from '@glimmer/validator';
import { setCustomTagFor } from '@glimmer/manager';

const EMBER_SVELTE_SHIM_PROPS = Symbol('EMBER_SVELTE_SHIM_PROPS');

export function toEmberSvelteProps(props) {
  const cleansedProps = Object.fromEntries(
    Object.entries(props).reduce((_props, [key, value]) => {
      if (!/^[\$]{2}/.test(key)) {
        return [..._props, [`${key}`, value]];
      }

      return _props;
    }, [])
  );

  cleansedProps[EMBER_SVELTE_SHIM_PROPS] = true;

  setCustomTagFor(cleansedProps, (_obj, key) =>
    tagForNamedArg(cleansedProps.named, key)
  );

  // return { named: cleansedProps, positional: [], [EMBER_SVELTE_SHIM_PROPS]: true };
  const argsProxy = argsProxyFor({ named: cleansedProps, positional: [] });

  argsProxy[EMBER_SVELTE_SHIM_PROPS] = true;

  return argsProxy;
}

export function isEmberSvelteProps(props) {
  if (!props || typeof props !== 'object') return false;

  return Boolean(props[EMBER_SVELTE_SHIM_PROPS]);
}

class NamedArgsProxy {
  [EMBER_SVELTE_SHIM_PROPS] = true;

  constructor(named) {
    this.named = named;
  }

  get(_target, prop) {
    const ref = this.named[prop];

    if (ref !== undefined) {
      // return valueForRef(ref);
      return ref;
    }
  }

  has(_target, prop) {
    return prop in this.named;
  }

  ownKeys() {
    return Object.keys(this.named);
  }

  isExtensible() {
    return false;
  }

  getOwnPropertyDescriptor(_target, prop) {
    if (
      true &&
      /* DEBUG */
      !(prop in this.named)
    ) {
      throw new Error(
        `args proxies do not have real property descriptors, so you should never need to call getOwnPropertyDescriptor yourself. This code exists for enumerability, such as in for-in loops and Object.keys(). Attempted to get the descriptor for \`${String(
          prop
        )}\``
      );
    }

    return {
      enumerable: true,
      configurable: true,
    };
  }
}

class PositionalArgsProxy {
  constructor(positional) {
    this.positional = positional;
  }

  get(target, prop) {
    var { positional } = this;

    if (prop === 'length') {
      return positional.length;
    }

    var parsed = convertToInt(prop);

    if (parsed !== null && parsed < positional.length) {
      return valueForRef(positional[parsed]);
    }

    return target[prop];
  }

  isExtensible() {
    return false;
  }

  has(_target, prop) {
    var parsed = convertToInt(prop);
    return parsed !== null && parsed < this.positional.length;
  }
}

function tagForNamedArg(namedArgs, key) {
  return track(() => {
    if (key in namedArgs) {
      valueForRef(namedArgs[key]);
    }
  });
}

function convertToInt(prop) {
  if (typeof prop === 'symbol') return null;
  var num = Number(prop);
  if (isNaN(num)) return null;
  return num % 1 === 0 ? num : null;
}

function tagForPositionalArg(positionalArgs, key) {
  return track(() => {
    if (key === '[]') {
      // consume all of the tags in the positional array
      positionalArgs.forEach(valueForRef);
    }

    var parsed = convertToInt(key);

    if (parsed !== null && parsed < positionalArgs.length) {
      // consume the tag of the referenced index
      valueForRef(positionalArgs[parsed]);
    }
  });
}

export function argsProxyFor(capturedArgs, type) {
  var { named, positional } = capturedArgs;

  var getNamedTag = (_obj, key) => tagForNamedArg(named, key);

  var getPositionalTag = (_obj, key) => tagForPositionalArg(positional, key);

  var namedHandler = new NamedArgsProxy(named);
  var positionalHandler = new PositionalArgsProxy(positional);
  var namedTarget = Object.create(null);
  var positionalTarget = [];

  if (
    true
    /* DEBUG */
  ) {
    var setHandler = function (_target, prop) {
      throw new Error(
        `You attempted to set ${String(
          prop
        )} on the arguments of a component, helper, or modifier. Arguments are immutable and cannot be updated directly, they always represent the values that is passed down. If you want to set default values, you should use a getter and local tracked state instead.`
      );
    };

    var forInDebugHandler = () => {
      throw new Error(
        `Object.keys() was called on the positional arguments array for a ${type}, which is not supported. This function is a low-level function that should not need to be called for positional argument arrays. You may be attempting to iterate over the array using for...in instead of for...of.`
      );
    };

    namedHandler.set = setHandler;
    positionalHandler.set = setHandler;
    positionalHandler.ownKeys = forInDebugHandler;
  }

  var namedProxy = new Proxy(namedTarget, namedHandler);
  var positionalProxy = new Proxy(positionalTarget, positionalHandler);

  setCustomTagFor(namedProxy, getNamedTag);
  setCustomTagFor(positionalProxy, getPositionalTag);

  return {
    named: namedProxy,
    positional: positionalProxy,
  };
}
