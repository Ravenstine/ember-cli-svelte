<script>
import { lookup } from 'ember-cli-svelte';

export let text, hashtags, via, classNames;

const TWEET_INTENT = 'https://twitter.com/intent/tweet';
const router = lookup('service:router');
const currentURL = new URL(router.currentURL, window.location.origin);
const shareURL = (() => {
  let url = new URL(TWEET_INTENT);

  url.searchParams.set('url', currentURL);

  if (text) {
    url.searchParams.set('text', text);
  }

  if (hashtags) {
    url.searchParams.set('hashtags', hashtags);
  }

  if (via) {
    url.searchParams.set('via', via);
  }

  return url;
})();
</script>

<a
  href={shareURL}
  target="_blank"
  rel="external nofollow noopener noreferrer"
  class="share button {classNames}"
>
  <slot></slot>
</a>
