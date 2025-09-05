// Simple version control for cache busting
const VERSION = Date.now().toString(); // Use timestamp as version

export const getVersion = () => VERSION;

export const getVersionedUrl = (url) => {
  if (url.includes('?')) {
    return `${url}&v=${VERSION}`;
  }
  return `${url}?v=${VERSION}`;
};

// Update document title with version for debugging
if (import.meta.env.DEV) {
  document.title = `Baraem Al-Noor v${VERSION.slice(-6)}`;
}
