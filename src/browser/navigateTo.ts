// Client-side navigation from anywhere in the app (the header's home link sits outside the
// editor that owns the selected guild). The URL is the source of truth, and useGuildCatalog
// already follows back/forward through "popstate", so announcing the push the same way keeps it
// in sync without threading a callback through every component in between.
export const navigateTo = (pathname: string) => {
  if (window.location.pathname !== pathname) {
    window.history.pushState(null, "", pathname);
  }

  window.dispatchEvent(new PopStateEvent("popstate"));
};
