import Resolver from 'ember-resolver';
import GlimmerComponent from '@glimmer/component';

const GLIMMER_TYPES = ['component', 'template'];

export default Resolver.extend({
  resolve(fullName) {
    const parsedName = this.parseName.call(this, fullName);

    // if we get a generic component name then
    // peek to see if there's a Svelte file export for it.
    if (GLIMMER_TYPES.includes(parsedName.type)) {
      // indirectly force module resolution
      const hasSvelteFile = Boolean(this._super(`${fullName}.svelte`));

      // return the default export of the js file
      // if it is a glimmer component
      if (hasSvelteFile) {
        const jsExport = this._super(fullName);

        if (jsExport && jsExport.prototype instanceof GlimmerComponent) {
          return jsExport;
        }
      }

      const moduleName = this.findModuleName(
        this.parseName.call(this, `${fullName}.svelte`)
      );
      const entry = this._moduleRegistry._entries[moduleName];

      // if the svelte module we found has
      // a GlimmerComponent export then use that
      if (entry) {
        const { GlimmerComponent } = entry.module.exports;

        if (GlimmerComponent) {
          return GlimmerComponent;
        }
      }
    }

    return this._super(...arguments);
  },
});
