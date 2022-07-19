'use strict';

const Plugin = require('broccoli-plugin');
const path = require('path');
const { compile /*, parse, preprocess, walk*/ } = require('svelte/compiler');
const { transformSync } = require('@babel/core');
const { default: template } = require('@babel/template');
const t = require('@babel/types');
const VersionChecker = require('ember-cli-version-checker');

const MIN_EMBER_VERSION = '6.28.0';

module.exports = {
  name: require('./package').name,

  included() {
    const checker = new VersionChecker(this.project);
    const ember = checker.for('ember-source');

    if (ember.lt(MIN_EMBER_VERSION)) {
      console.warn(
        '\x1b[33m',
        `\nember-cli-svelte requires a version of ember-source >= ${MIN_EMBER_VERSION}.  Your app is using ember-source ${ember.version} and is likely to encounter errors.  Please update to a more recent version of ember-source.\n`
      );
    }

    this._super(...arguments);
  },

  setupPreprocessorRegistry(type, registry) {
    registry.add('template', {
      name: 'ember-cli-svelte',
      ext: 'svelte',
      _addon: this,
      toTree(tree) {
        return new SveltePlugin([tree], {});
      },
    });

    if (type === 'parent') {
      this.parentRegistry = registry;
    }
  },
};

class SveltePlugin extends Plugin {
  constructor(inputNodes, options = {}) {
    super(inputNodes, options);

    this.options = options;
    this.inputNodes = inputNodes;
    this.name = 'ember-cli-svelte';
    this.ext = ['svelte'];
  }

  build() {
    walkPluginDirs(this, ({ tree, entry, file }) => {
      const parsedPath = path.parse(entry.relativePath);

      if (parsedPath.ext !== '.svelte') {
        tree.output.writeFileSync(entry.relativePath, file, {
          encoding: 'UTF-8',
        });

        return;
      }

      compileSvelteComponent({
        tree,
        entry,
        svelteComponentMarkup: file,
      });
    });
  }
}

function walkPluginDirs(plugin, callback) {
  const walkOptions = {
    includeBasePath: true,
    // directories: false,
  };

  let i = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const inputNode = plugin.input.at(i);

    i++;

    if (!inputNode) break;

    const entries = (() => {
      try {
        return inputNode.fs.entries('./', walkOptions);
      } catch {
        return null;
      }
    })();

    if (!entries) break;

    for (const entry of entries) {
      const isDirectory = plugin.input
        .lstatSync(entry.relativePath)
        .isDirectory();

      if (isDirectory) {
        plugin.output.mkdirSync(entry.relativePath);

        continue;
      }

      const file = plugin.input.readFileSync(entry.relativePath, {
        encoding: 'UTF-8',
      });

      callback({
        tree: plugin,
        entry,
        file,
      });
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

function compileSvelteComponent({ tree, entry, svelteComponentMarkup }) {
  const inputParsedPath = path.parse(entry.relativePath);
  const compiled = compile(svelteComponentMarkup, {
    format: 'esm',
    preserveComments: true,
  });

  for (const warning of compiled.warnings) {
    // Since we are using the `tag` option but aren't
    // defining a web component, there's no point in
    // the following warning so just ignore it.
    if (warning.code === 'missing-custom-element-compile-options') continue;

    console.warn(`\n${warning.toString()}`);
  }

  const svelteOptions = parseSvelteOptions(compiled);

  const plugins = [
    {
      visitor: {
        Program(path) {
          const setOptionsImport = template.ast(`
            import { setSvelteOptions } from 'ember-cli-svelte/lib/svelte-options';
          `);

          path.unshiftContainer('body', setOptionsImport);
        },
        ExportDefaultDeclaration(path) {
          const identifier = path.node.declaration;

          if (identifier.type !== 'Identifier') return;

          const callExpression = t.callExpression(
            t.identifier('setSvelteOptions'),
            [
              t.identifier(identifier.name),
              template.ast(`(${JSON.stringify(svelteOptions)})`).expression,
            ]
          );

          path.node.declaration = callExpression;
        },
      },
    },
  ];

  const { code } = transformSync(compiled.js.code, { plugins });

  const compiledSvelteComponentParsedPath = { ...inputParsedPath };

  compiledSvelteComponentParsedPath.ext = '.js';
  compiledSvelteComponentParsedPath.name =
    compiledSvelteComponentParsedPath.base;
  compiledSvelteComponentParsedPath.base = `${compiledSvelteComponentParsedPath.name}${compiledSvelteComponentParsedPath.ext}`;

  const compiledSvelteComponentPath = path.format(
    compiledSvelteComponentParsedPath
  );

  tree.output.writeFileSync(compiledSvelteComponentPath, code, {
    encoding: 'UTF-8',
  });

  return compiled;
}
