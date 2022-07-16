import Resolver from 'ember-resolver';
import EmberSvelteComponent from './components/-private/ember-svelte-component';
import { hbs } from 'ember-cli-htmlbars';

export default Resolver.extend({
  resolveOther(parsedName) {
    const { fullName } = parsedName;

    if (parsedName.type !== 'component') return this._super(...arguments);

    const maybeResolvedComponent = this._super(...arguments);
    const hasSvelteExtension = /\.svelte$/.test(parsedName.name);

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

  resolveTemplate(parsedName) {
    const { fullName } = parsedName;
    const hasSvelteExtension = /\.svelte$/.test(parsedName.name);
    const maybeResolvedTemplate = this._super(...arguments);

    if (hasSvelteExtension) return maybeResolvedTemplate;

    if (maybeResolvedTemplate) return maybeResolvedTemplate;

    const maybeResolvedSvelteTemplate = this.resolve(`${fullName}.svelte`);

    if (!maybeResolvedSvelteTemplate) return;

    const templateFactory = hbs`
      {{component "-private/ember-svelte-component" svelteComponentClass="__SVELTE_TEMPLATE_NAME__" model=@model controller=this.controller}}
    `;

    return (owner) => {
      const templateResult = templateFactory(owner);

      templateResult.parsedLayout.block = injectSvelteTemplatePath(
        templateResult.parsedLayout.block,
        `${parsedName.name}.svelte`
      );

      return templateResult;
    };
  },
});

function injectSvelteTemplatePath(block, svelteTemplatePath) {
  if (!Array.isArray(block)) return block;

  return block.map((item) => {
    if (item === '__SVELTE_TEMPLATE_NAME__') return svelteTemplatePath;

    if (Array.isArray(item))
      return injectSvelteTemplatePath(item, svelteTemplatePath);

    return item;
  });
}
