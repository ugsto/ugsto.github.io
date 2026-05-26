import { browser } from '$app/environment';

const KEY = 'workshop-presentation-mode';

function createPresentationMode() {
  let value = $state(browser ? sessionStorage.getItem(KEY) === 'true' : false);

  return {
    get enabled() {
      return value;
    },
    toggle() {
      value = !value;
      if (browser) sessionStorage.setItem(KEY, String(value));
    },
    set(v: boolean) {
      value = v;
      if (browser) sessionStorage.setItem(KEY, String(v));
    }
  };
}

export const presentationMode = createPresentationMode();
