import Ember from 'ember';
import { getOwner } from '@ember/application';
import { assert } from '@ember/debug';

const { OutletView } = Ember.__loader.require('@ember/-internals/glimmer/index');

export default class SvelteOutletView extends OutletView {
  static create(options) {
    const {
      environment: _environment,
      application: namespace,
      template: templateFactory,
    } = options;

    const owner = getOwner(options);

    if (!owner) {
      assert('OutletView is unexpectedly missing an owner', owner);
    }

    const template = templateFactory(owner);

    return new this(_environment, owner, template, namespace);
  }
}
