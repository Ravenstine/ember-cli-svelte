import Resolver from 'ember-resolver';
import EmberSvelteComponent from './components/-private/ember-svelte-component';

export default Resolver.extend({
  resolve(fullName) {
    const parsedName = this.parseName.call(this, fullName);

    if (parsedName.type !== 'component') return this._super(...arguments);

    const hasSvelteExtension = /\.svelte$/.test(parsedName.name);
    const maybeResolvedComponent = this._super(...arguments);

    if (hasSvelteExtension) {
      if (maybeResolvedComponent) {
        return class extends EmberSvelteComponent {
          constructor() {
            super(...arguments);

            this.svelteComponentClass = maybeResolvedComponent;
          }
        };
      }

      return;
    }

    if (maybeResolvedComponent) return maybeResolvedComponent;

    return this.resolve(`${fullName}.svelte`);
  },
});
