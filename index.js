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
      // Since we are using the `tag` option but aren't
      // defining a web component, there's no point in
      // the following warning so just ignore it.
      if (warning.code === 'missing-custom-element-compile-options') continue;

      console.warn(`\n${warning.toString()}`);
    }

    const svelteOptions = parseSvelteOptions(compiled);
    const tagName = svelteOptions.tag?.length ? svelteOptions.tag : 'div';

    const trackedProps = compiled.vars.reduce((props, { export_name }) => {
      if (export_name) return `${props}@tracked ${export_name};\n`;

      return props;
    }, '');

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
    code.unshift(
      "import { flush as internalFlush, noop } from 'svelte/internal';"
    );

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

          const fragment = new DocumentFragment();

          // These overrides are meant to overcome some
          // errors caused by the way that Glimmer handles
          // its rendered elements.
          fragment.removeChild = child => {
            child.remove?.();
          }
          fragment.insertBefore = (node, reference) => {
            const parent = (reference || {}).parentNode || fragment;
            DocumentFragment.prototype.insertBefore.apply(parent, [node, reference]);
          };
          Object.defineProperty(fragment, 'parentNode', {
            value: fragment,
          });

          fragment.replaceChildren(...element.childNodes);

          let defaultSlotTarget;

          this.#component = new Component({ 
            target: element,
            props: {
              ...this.#args,
              $$scope: {},
              // See: https://github.com/sveltejs/svelte/issues/2588
              // This is here to support passing a block from the
              // Glimmer component to the default slot of the Svelte
              // component.
              $$slots: {
                default: [() => ({
                  c: noop,
                  m(target, anchor) {
                    defaultSlotTarget = target;

                    insert(target, fragment, anchor);
                  },
                  d(detaching) {
                    if (!detaching) return;

                    fragment.replaceChildren(...(defaultSlotTarget.childNodes || []));

                    detach(fragment);
                  },
                  l: noop,
                })],
              }
            },
          });
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
            {{did-update this.updateSvelteComponent ${compiled.vars.reduce(
              (props, { export_name }) => {
                if (export_name) return `${props} @${export_name}`;

                return props;
              },
              ''
            )} }}
            {{will-destroy this.teardownSvelteComponent}}
            ...attributes>{{yield}}</SvelteComponentElement>
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

function parseSvelteOptions(compilation) {
  return (
    compilation.ast.html.children.find(
      (child) => child.name === 'svelte:options'
    ) || { attributes: [] }
  ).attributes.reduce((attrs, attr) => {
    attrs[attr.name] = attr.value?.[0]?.data;
    return attrs;
  }, {});
}
