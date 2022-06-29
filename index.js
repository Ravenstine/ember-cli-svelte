'use strict';

const Plugin = require('broccoli-plugin');
const path = require('path');
const { compile /*, parse, preprocess, walk*/ } = require('svelte/compiler');

module.exports = {
  name: require('./package').name,

  included(app) {
    this._super.included.apply(this, arguments);

    // deno-lint-ignore no-this-alias
    let current = this;

    do {
      app = current.app || app;
    } while (current.parent.parent && (current = current.parent));

    this.app = app;
  },

  preprocessTree(type, tree) {
    if (type === 'template') {
      return new SveltePlugin([tree]);
    }

    return tree;
  },
};

class SveltePlugin extends Plugin {
  constructor(inputNodes, options = {}) {
    super(inputNodes, options);
  }

  build() {
    const walkOptions = {
      includeBasePath: true,
    };

    for (const entry of this.input.entries('./', walkOptions)) {
      const parsedPath = path.parse(entry.relativePath);
      const isDirectory = this.input
        .lstatSync(entry.relativePath)
        .isDirectory();

      if (isDirectory) {
        this.output.mkdirSync(entry.relativePath);

        continue;
      }

      const file = this.input.readFileSync(entry.relativePath, {
        encoding: 'UTF-8',
      });

      if (parsedPath.ext !== '.svelte') {
        this.output.writeFileSync(entry.relativePath, file, {
          encoding: 'UTF-8',
        });

        continue;
      }

      const compiled = compileSvelteComponent(this, parsedPath, file);

      buildGlimmerComponent(this, parsedPath, compiled.vars);

      const svelteOptions = parseSvelteOptions(compiled);

      buildHBSTemplate(this, parsedPath, compiled.vars, svelteOptions);
    }
  }
}

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

function compileSvelteComponent(tree, inputParsedPath, svelteComponentMarkup) {
  const compiled = compile(svelteComponentMarkup, { format: 'esm' });

  for (const warning of compiled.warnings) {
    // Since we are using the `tag` option but aren't
    // defining a web component, there's no point in
    // the following warning so just ignore it.
    if (warning.code === 'missing-custom-element-compile-options') continue;

    console.warn(`\n${warning.toString()}`);
  }

  const compiledSvelteComponentParsedPath = { ...inputParsedPath };

  compiledSvelteComponentParsedPath.ext = '.js';
  compiledSvelteComponentParsedPath.name =
    compiledSvelteComponentParsedPath.base;
  compiledSvelteComponentParsedPath.base = `${compiledSvelteComponentParsedPath.name}${compiledSvelteComponentParsedPath.ext}`;

  const compiledSvelteComponentPath = path.format(
    compiledSvelteComponentParsedPath
  );

  tree.output.writeFileSync(compiledSvelteComponentPath, compiled.js.code, {
    encoding: 'UTF-8',
  });

  return compiled;
}

function buildGlimmerComponent(tree, inputParsedPath, vars) {
  // const svelteOptions = parseSvelteOptions(compiledSvelteComponent);
  // const tagName = svelteOptions.tag?.length ? svelteOptions.tag : 'div';
  const glimmerComponentCode = `
    import SvelteComponent from './${inputParsedPath.base}';
    import GlimmerComponent from '@glimmer/component';
    import SvelteContent from 'ember-cli-svelte/components/-private/svelte-content';
    import { tracked } from '@glimmer/tracking';
    import { action } from '@ember/object';
    import { ensureSafeComponent } from '@embroider/util';
    import { detach, flush, insert, noop } from 'svelte/internal';

    class EmberSvelteComponent extends GlimmerComponent {
      #args = {};
      #component;
      #element;
      #startBound;
      #endBound;

      @tracked _showStartBound = true;
      @tracked _showEndBound = true;

      ${vars.reduce((props, { export_name }) => {
        if (export_name) return `${props} @tracked ${export_name};`;

        return props;
      }, '')}

      get svelteContent() {
        return ensureSafeComponent(SvelteContent, this);
      }

      constructor(owner, args) {
        super(...arguments);

        this.#args = args;
      }

      @action
      getStartBound(element) {
        this.#startBound = element;

        this._showStartBound = false;
      }

      @action
      getEndBound(element) {
        this.#endBound = element;

        this._showEndBound = false;
      }

      @action
      insertSvelteComponent(referenceElement) {
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

        const blockContent = ((startBound, endBound) => {
          const nodes = [];

          let currentNode = startBound.nextSibling;

          while (currentNode !== endBound) {
            nodes.push(currentNode);
            currentNode = currentNode.nextSibling;
          }

          return nodes;
        })(this.#startBound, this.#endBound);

        fragment.replaceChildren(...blockContent);

        this._showReference = false;

        let defaultSlotTarget;

        this.#component = new SvelteComponent({
          // Doesn't seem to matter that the end-bound element
          // gets removed by Glimmer after the Svelte component renders.
          anchor: this.#endBound,
          target: this.#endBound.parentElement,
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

                  const childNodes = Array
                    .from(defaultSlotTarget.childNodes || []);

                  fragment.replaceChildren(...childNodes);

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

        flush();
      }

      @action
      teardownSvelteComponent() {
        this.#component.$destroy();
      }
    }

    export default EmberSvelteComponent;
  `;

  const glimmerComponentParsedPath = { ...inputParsedPath };

  glimmerComponentParsedPath.ext = '.js';
  glimmerComponentParsedPath.base = `${glimmerComponentParsedPath.name}${glimmerComponentParsedPath.ext}`;

  const glimmerComponentPath = path.format(glimmerComponentParsedPath);

  tree.output.writeFileSync(glimmerComponentPath, glimmerComponentCode, {
    encoding: 'UTF-8',
  });
}

function buildHBSTemplate(tree, inputParsedPath, vars, svelteOptions) {
  const glimmerTemplateParsedPath = { ...inputParsedPath };
  const tagName = svelteOptions.tag?.length ? svelteOptions.tag : 'div';
  glimmerTemplateParsedPath.ext = '.hbs';
  glimmerTemplateParsedPath.base = `${glimmerTemplateParsedPath.name}${glimmerTemplateParsedPath.ext}`;

  const glimmerTemplatePath = path.format(glimmerTemplateParsedPath);
  const glimmerTemplateCode = `
    {{#let (component this.svelteContent) as |SvelteContent|}}
      <SvelteContent @tagName="${tagName}" ...attributes>
        {{#if this._showStartBound}}<span {{did-insert this.getStartBound}}></span>{{/if}}
        {{yield}}
        {{#if this._showEndBound}}<span {{did-insert this.getEndBound}} {{did-insert this.insertSvelteComponent}}></span>{{/if}}
        {{did-update this.updateSvelteComponent ${vars.reduce(
          (props, { export_name }) => {
            if (export_name) return `${props} @${export_name}`;

            return props;
          },
          ''
        )} }}
        {{will-destroy this.teardownSvelteComponent}}
      </SvelteContent>
    {{/let}}
  `;

  tree.output.writeFileSync(glimmerTemplatePath, glimmerTemplateCode, {
    encoding: 'UTF-8',
  });
}
