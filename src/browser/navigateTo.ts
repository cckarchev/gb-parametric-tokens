// Client-side navigation from anywhere. useGuildCatalog follows the URL through
// "popstate", so firing one after the push keeps it in sync with no callback to
// thread down.
export const navigateTo = (pathname: string) => {
  if (window.location.pathname !== pathname) {
    window.history.pushState(null, "", pathname);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
};
