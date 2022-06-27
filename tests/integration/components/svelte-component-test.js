import { module, test } from 'qunit';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { set } from '@ember/object';

module('Integration | Component | svelte-component', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders and updates props', async function (assert) {
    set(this, 'name', 'Tomster');

    await render(hbs`
      <Hello @name={{this.name}}>
        <b data-test-block-content>Ember + Svelte</b>
      </Hello>
    `);

    assert.dom('h2').hasText('Hello, Tomster!', 'passes props');

    set(this, 'name', 'Zoey');

    await settled();

    assert.dom('h2').hasText('Hello, Zoey!', 'updates props');

    assert.dom('h3').hasText('Ember + Svelte');
  });

  test('it supports an optional wrapping element', async function (assert) {
    await render(hbs`
      <Tagged data-test-svelte-component>is tagged</Tagged>
    `);

    assert.dom('[data-test-svelte-component]').hasTagName('tagged-component');
    assert.dom('[data-test-svelte-component]').hasText('is tagged');
  });
});