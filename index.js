'use strict';

const Plugin = require('broccoli-plugin');
const path = require('path');
const { compile /*, parse, preprocess, walk*/ } = require('svelte/compiler');
const { transformSync } = require('@babel/core');
const t = require('@babel/types');
const glimmer = require('@glimmer/syntax');

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

      buildGlimmerComponent(this, parsedPath);

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

function buildGlimmerComponent(tree, inputParsedPath) {
  const { code: glimmerComponentCode } = transformSync(
    `
    import EmberSvelteComponent from 'ember-cli-svelte/components/-private/ember-svelte-component';

    export default class extends EmberSvelteComponent {
      constructor() {
        super(...arguments);

        this.svelteComponentClass = SvelteComponent;
      }
    }
  `,
    {
      plugins: [
        {
          visitor: {
            Program(path) {
              path.unshiftContainer(
                'body',
                t.importDeclaration(
                  [t.importDefaultSpecifier(t.identifier('SvelteComponent'))],
                  t.stringLiteral(`./${inputParsedPath.base}`)
                )
              );
            },
          },
        },
      ],
    }
  );

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
  const tagName = svelteOptions.tag?.length ? svelteOptions.tag : null;
  glimmerTemplateParsedPath.ext = '.hbs';
  glimmerTemplateParsedPath.base = `${glimmerTemplateParsedPath.name}${glimmerTemplateParsedPath.ext}`;

  const glimmerTemplatePath = path.format(glimmerTemplateParsedPath);
  const ast = glimmer.preprocess(`
    {{#let (component this.svelteContent) as |SvelteContent|}}
      <SvelteContent ...attributes>
        {{#if this.defaultSlotElement}}{{#in-element this.defaultSlotElement nextSibling=this.defaultSlotAnchor}}{{#if this.showsDefaultSlot}}{{yield}}{{/if}}{{/in-element}}{{/if}}
        {{#if this.showsAnchor}}<span {{did-insert this.getEndBound}} {{did-insert this.insertSvelteComponent}}></span>{{/if}}
        {{did-update this.updateSvelteComponent}}
        {{will-destroy this.teardownSvelteComponent}}
      </SvelteContent>
    {{/let}}
  `);

  glimmer.traverse(ast, {
    ElementNode(node) {
      if (!tagName || node.tag !== 'SvelteContent') return;

      node.attributes.unshift(
        glimmer.builders.attr('@tagName', glimmer.builders.text(tagName))
      );
    },
    MustacheStatement(node) {
      connectUpdateProps(node, vars);
    },
    ElementModifierStatement(node) {
      connectUpdateProps(node, vars);
    },
  });

  const glimmerTemplateCode = glimmer.print(ast);

  tree.output.writeFileSync(glimmerTemplatePath, glimmerTemplateCode, {
    encoding: 'UTF-8',
  });
}

function connectUpdateProps(node, vars) {
  if (node.path.original !== 'did-update') return;

  for (const { export_name } of vars) {
    if (!export_name) continue;

    node.params.push(glimmer.builders.path(`@${export_name}`));
  }
}
