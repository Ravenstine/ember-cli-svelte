import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  @tracked name = 'Tomster';
  @tracked date = new Date().toUTCString();
  @tracked showsDate = true;

  constructor() {
    super(...arguments);

    setInterval(() => (this.date = new Date().toUTCString()), 10);
    // setInterval(() => (this.showsDate = !this.showsDate), 2000);
  }
}
