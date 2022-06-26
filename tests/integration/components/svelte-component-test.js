import { module, test } from 'qunit';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { find, render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { set } from '@ember/object';

module('Integration | Component | svelte-component', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders and updates props', async function (assert) {
    set(this, 'name', 'Tomster');

    await render(hbs`<Hello @name={{this.name}} data-test-svelte-component />`);

    assert.dom(this.element).hasText('Hello, Tomster!', 'passes props');

    set(this, 'name', 'Zoey');

    await settled();

    assert.dom(this.element).hasText('Hello, Zoey!', 'updates props');

    assert.dom('[data-test-svelte-component]').hasTagName('hello-ember');
  });
});
