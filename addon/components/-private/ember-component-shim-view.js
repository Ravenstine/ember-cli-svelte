// eslint-disable-next-line ember/no-classic-components
import Component, { setComponentTemplate } from '@ember/component';
import { tracked } from '@glimmer/tracking';
import { hbs } from 'ember-cli-htmlbars';

export default class EmberComponentShimView extends Component {
  tagName = '';
  defaultBlockAnchor;
  defaultBlockElement;

  @tracked emberComponentNameOrClass;
  @tracked props;
}

setComponentTemplate(
  hbs`
    {{#component (-private/spread-args-for this.emberComponentNameOrClass this.props)}}
      {{this.defaultBlockElement}}
    {{/component}}
  `,
  EmberComponentShimView
);
