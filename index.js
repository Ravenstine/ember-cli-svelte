'use strict';

const Filter = require('broccoli-filter');
const { compile /*, parse, preprocess, walk*/ } = require('svelte/compiler');

class SvelteComponentFilter extends Filter {
  extensions = ['svelte'];
  targetExtension = 'js';

  constructor(inputTree, options) {
    super(inputTree, options);

    this.options = options || {};
    this.inputTree = inputTree;
  }

  processString(string /*, relativePath */) {
    const compiled = compile(string, { format: 'esm' });

    for (const warning of compiled.warnings) {
      console.warn(`\n${warning.toString()}`);
    }

    const svelteOptions = (
      compiled.ast.html.children.find(
        (child) => child.name === 'svelte:options'
      ) || { attributes: [] }
    ).attributes.reduce((attrs, attr) => {
      attrs[attr.name] = attr.value?.[0]?.data;
      return attrs;
    }, {});
    const tagName = svelteOptions.tag?.length ? svelteOptions.tag : 'div';

    const trackedProps = compiled.vars
      .map(({ export_name }) => `@tracked ${export_name};\n`)
      .join('');

    let code = (compiled?.js?.code || '').split('\n');

    // remove the default export statement
    code.pop();

    // provide named export for svelte component
    code.push(`export { Component };`);

    // add glimmer imports
    code.unshift("import GlimmerComponent from '@glimmer/component';");
    code.unshift("import { tracked } from '@glimmer/tracking';");
    code.unshift("import { action } from '@ember/object';");
    code.unshift("import { setComponentTemplate } from '@ember/component';");
    code.unshift("import { hbs } from 'ember-cli-htmlbars';");
    code.unshift("import { flush as internalFlush } from 'svelte/internal';");

    // define glimmer component
    code.push(`
      class SvelteWrapperComponent extends GlimmerComponent {
        #args = {};
        #component;
        #element;

        ${trackedProps}

        constructor(owner, args) {
          super(...arguments);
          this.#args = args;
        }

        @action
        setupSvelteComponent(element) {
          this.#element = element;
          this.#component = new Component({ target: element, props: this.#args });
        }

        @action
        updateSvelteComponent(element, argList, args) {
          const component = this.#component;

          component.$set(this.#args);

          internalFlush();
        }

        @action
        teardownSvelteComponent() {
          this.#component.$destroy();
        }
      }

      const template = hbs\`
        {{#let (element "${tagName}") as |SvelteComponentElement|}}
          <SvelteComponentElement
            {{did-insert this.setupSvelteComponent}}
            {{did-update this.updateSvelteComponent ${compiled.vars
              .map(({ export_name }) => `@${export_name}`)
              .join(' ')} }}
            {{will-destroy this.teardownSvelteComponent}}
            ...attributes />
        {{/let}}
      \`;

      setComponentTemplate(template, SvelteWrapperComponent);

      export default SvelteWrapperComponent;
    `);

    return code.join('\n');
  }
}

module.exports = {
  name: require('./package').name,

  included(app) {
    this._super.included.apply(this, arguments);

    let current = this;

    do {
      app = current.app || app;
    } while (current.parent.parent && (current = current.parent));

    this.app = app;

    const compiler = {
      name: 'ember-cli-svelte',
      ext: ['svelte'],
      toTree(tree) {
        return new SvelteComponentFilter(tree, {});
      },
    };

    app.registry.add('template', compiler);
  },
};
