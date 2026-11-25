/**
 * fetch() that refuses to fail quietly.
 *
 * The admin's list pages all did `if (res.ok) setRows(...)`, which treats a
 * 500 exactly like an empty collection. Three routes then returned 500 on
 * every request and the panel showed "no orders" instead of an error — see
 * LoadState.jsx for the full story.
 *
 * This throws on a non-2xx response, carrying the server's own message where
 * there is one, so a caller's catch block has something worth showing.
 */
export async function fetchJson(url, options) {
  const res = await fetch(url, options);

  let data = null;
  try {
    data = await res.json();
  } catch {
    // A 500 from the framework can be HTML, not JSON. Not fatal — the
    // status line below is still the useful part.
  }

  if (!res.ok) {
    const detail = data?.error || `${res.status} ${res.statusText}`.trim();
    const err = new Error(detail);
    err.status = res.status;
    throw err;
  }

  return data;
}

export default fetchJson;
