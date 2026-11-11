function normalizeMediaUrl(value) {
  if (!value) return '';
  const url = String(value).trim();
  if (!url) return '';
  if (url.startsWith('/uploads/')) return url.split('?')[0];

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/')) return parsed.pathname;
  } catch {
    return url;
  }

  return url;
}

module.exports = { normalizeMediaUrl };
