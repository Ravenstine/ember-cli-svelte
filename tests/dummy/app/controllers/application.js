import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  @tracked name = 'Tomster';
  @tracked date = new Date().toUTCString();

  constructor() {
    super(...arguments);

    setInterval(() => (this.date = new Date().toUTCString()), 10);
  }
}
