'use strict';

const Filter = require('broccoli-filter');
const { compile, parse, preprocess, walk } = require('svelte/compiler');

class SvelteFilter extends Filter {
  extensions = ['svelte'];
  targetExtension = 'js';

  constructor(inputTree, options) {
    super(inputTree, options);

    this.options = options || {};
    this.inputTree = inputTree;
  }

  processString(string, relativePath) {
    const compiled = compile(string);

    return compiled?.js?.code;
  }
}

module.exports = {
  name: require('./package').name,

  // included(app) {
  //   this._super.included.apply(this, arguments);

  //   let current = this;
  //   // Keep iterating upward until we don't have a grandparent.
  //   // Has to do this grandparent check because at some point we hit the project.
  //   do {
  //     app = current.app || app;
  //   } while (current.parent.parent && (current = current.parent));

  //   // console.log(app);

  //   this.app = app;
  // },

  included(app) {
    this._super.included.apply(this, arguments);

    let current = this;
    // Keep iterating upward until we don't have a grandparent.
    // Has to do this grandparent check because at some point we hit the project.
    do {
      app = current.app || app;
    } while (current.parent.parent && (current = current.parent));

    // console.log(app);

    this.app = app;

    const addonContext = this;
    // console.log(this)
    const compiler = {
      name: 'ember-cli-svelte',
      ext: ['svelte'],
      toTree(tree) {
        return new SvelteFilter(tree, {});
      },
    };

    app.registry.add('template', compiler);
  },

  // postprocessTree(type, tree) {
  //   if (type === 'js') {
  //     // console.log(tree._inputNodes[0].inputNodes[0].inputNodes[5]._inputNodes[0].inputNodes[0]._inputNodes[1]._inputNodes);
  //     console.log(crawl(tree, []));
  //     // console.log(tree);
  //   }

  //   return tree;
  //   // return this._super.preprocessTree.apply(this, arguments);
  // },
};

// function crawl(node, list) {
//   if (typeof node !== 'object') return list;

//   const inputNodes = node.inputNodes || node._inputNodes || [];

//   const newList = [...list, ...inputNodes];

//   for (const node of inputNodes) {
//     console.log(node);
//     newList.concat(crawl(node, []));
//   }

//   return newList;
// }
