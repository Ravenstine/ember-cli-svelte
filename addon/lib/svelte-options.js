const OPTIONS_MAP = new WeakMap();

export function setSvelteOptions(svelteClass, svelteOptions) {
  OPTIONS_MAP.set(svelteClass, svelteOptions);

  return svelteClass;
}

export function getSvelteOptions(svelteClass) {
  return OPTIONS_MAP.get(svelteClass) || Object.create(null);
}
