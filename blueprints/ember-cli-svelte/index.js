const { transformSync } = require('@babel/core');
const t = require('@babel/types');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

module.exports = {
  name: 'ember-cli-svelte',
  description: 'Installs ember-cli-svelte',
  works: 'insideProject',

  normalizeEntityName() {},

  afterInstall({ project }) {
    const appFilePath = path.join(project.root, 'app', 'app.js');
    const file = readFileSync(appFilePath, 'utf8');

    const { code } = transformSync(file, {
      plugins: [
        {
          visitor: {
            ImportDeclaration(path) {
              const node = path.node;

              if (node.source.value !== 'ember-resolver') return;

              node.source = t.stringLiteral('ember-cli-svelte/resolver');
            },
          },
        },
      ],
    });

    writeFileSync(appFilePath, code, 'utf8');

    if (!('svelte' in this.project.dependencies())) {
      return this.addPackagesToProject([{ name: 'svelte', target: '^3.48.0' }]);
    }
  },

  afterUninstall({ project }) {
    const appFilePath = path.join(project.root, 'app', 'app.js');

    const file = readFileSync(appFilePath, 'utf8');

    const { code } = transformSync(file, {
      plugins: [
        {
          visitor: {
            ImportDeclaration(path) {
              const node = path.node;

              if (node.source.value !== 'ember-cli-svelte/resolver') return;

              node.source = t.stringLiteral('ember-resolver');
            },
          },
        },
      ],
    });

    writeFileSync(appFilePath, code, 'utf8');
  },
};
