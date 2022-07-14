import { module, test } from 'qunit';
import { setupRenderingTest } from 'dummy/tests/helpers';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { set } from '@ember/object';
import { message as moduleContextMessage } from 'dummy/components/module-context.svelte';

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

  test('it can import other Svelte components by relative path', async function (assert) {
    await render(hbs`
      <CanImport data-test-can-import />
    `);

    assert.dom('[data-test-can-import]').exists();
  });

  test('it does not interfere with colocated file resolution', async function (assert) {
    await render(hbs`
      <Colocated />
    `);

    assert.dom('[data-test-colocated-name]').hasText('Zoey');
  });

  test('it supports module context', function (assert) {
    assert.deepEqual(moduleContextMessage, 'Ember is Omakase');
  });
});
