// Kept in its own module, apart from usePreview, so a test can assert against
// the same delay the hook uses without importing the hook (and with it the
// worker) just to read one number.
export const LIVE_PREVIEW_DEBOUNCE_MS = 300;
