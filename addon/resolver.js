import Resolver from 'ember-resolver';
import Component from '@glimmer/component';

const GLIMMER_TYPES = ['component', 'template'];

export default Resolver.extend({
  resolve(fullName) {
    const parsedName = this.parseName.call(this, fullName);

    // if we get a generic component name then
    // peek to see if there's a Svelte file export for it.
    if (!GLIMMER_TYPES.includes(parsedName.type))
      return this._super(...arguments);

    // indirectly force module resolution
    const hasSvelteFile = Boolean(this._super(`${fullName}.svelte`));

    // return the default export of the js file
    // if it is a glimmer component
    if (!hasSvelteFile) return this._super(...arguments);

    const jsExport = this._super(fullName);

    if (jsExport && jsExport.prototype instanceof Component) {
      return jsExport;
    }

    // if the svelte module we found has
    // a GlimmerComponent export then use that
    const { GlimmerComponent } = getSvelteFile(this, fullName) || {};

    return GlimmerComponent;
  },
});

function getSvelteFile(resolver, fullName) {
  const moduleName = resolver.findModuleName(
    resolver.parseName.call(resolver, `${fullName}.svelte`)
  );
  const entry = resolver._moduleRegistry._entries[moduleName];

  // if the svelte module we found has
  // a GlimmerComponent export then use that
  if (entry) return entry.module.exports;

  return null;
}
