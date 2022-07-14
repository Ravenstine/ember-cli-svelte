'use strict';

const Plugin = require('broccoli-plugin');
const path = require('path');
const { compile /*, parse, preprocess, walk*/ } = require('svelte/compiler');
const { transformSync } = require('@babel/core');
const { default: template } = require('@babel/template');
const t = require('@babel/types');

module.exports = {
  name: require('./package').name,

  preprocessTree(type, tree) {
    if (type !== 'template') return tree;

    return new SveltePlugin([tree, this.treeFor('addon')], {});
  },
};

class SveltePlugin extends Plugin {
  constructor(inputNodes, options = {}) {
    super(inputNodes, options);

    this.options = options;
    this.inputNodes = inputNodes;
  }

  build() {
    walkPluginDirs(this, ({ tree, entry, file, isAddon }) => {
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
        useAMD: isAddon,
      });
    });
  }
}

function walkPluginDirs(plugin, callback) {
  const walkOptions = {
    includeBasePath: true,
  };

  const appEntries = plugin.input.at(0).fs.entries('./', walkOptions);
  const addonEntries = plugin.input.at(1).fs.entries('./', walkOptions);

  for (const entries of [appEntries, addonEntries]) {
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
        isAddon: entries === addonEntries,
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

function compileSvelteComponent({
  tree,
  entry,
  svelteComponentMarkup,
  useAMD,
}) {
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

  // For some reason, when operating on addon/ directories and merging that
  // with the tree being preprocessed, unlike files under app/ directories,
  // AMD doesn't seem to be getting applied to files in addon-tree-output/.
  // Why?  I dunno.  This is the only solution I've found to support hosting
  // plain .svelte files in the addon/ directory and allowing them to be
  // imported within the app under the expected add-on-name/*.svelte path.
  if (useAMD)
    plugins.push([
      '@babel/plugin-transform-modules-amd',
      { moduleId: entry.relativePath },
    ]);

  const { code } = transformSync(compiled.js.code, { plugins });
  console.log(code);
  const compiledSvelteComponentParsedPath = { ...inputParsedPath };

  compiledSvelteComponentParsedPath.ext = '.js';
  compiledSvelteComponentParsedPath.name =
    compiledSvelteComponentParsedPath.base;
  compiledSvelteComponentParsedPath.base = `${compiledSvelteComponentParsedPath.name}${compiledSvelteComponentParsedPath.ext}`;

  const compiledSvelteComponentPath = path.format(
    compiledSvelteComponentParsedPath
  );
  console.log(path.join(entry.basePath, compiledSvelteComponentPath));

  tree.output.writeFileSync(
    path.join(entry.basePath, compiledSvelteComponentPath),
    code,
    {
      encoding: 'UTF-8',
    }
  );

  return compiled;
}
