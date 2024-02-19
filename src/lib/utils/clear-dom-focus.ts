export function clearDomFocus() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
