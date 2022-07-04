const { transformSync } = require('@babel/core');
const t = require('@babel/types');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

module.exports = {
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
