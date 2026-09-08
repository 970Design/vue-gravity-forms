// Module-level request sharing.
//
// A page often mounts the same form more than once (e.g. a signup strip in the
// content and the same form in the footer), and every instance used to fetch the
// form schema and the reCAPTCHA config on its own. Requests are keyed on what
// makes them unique (endpoint, form id, API key) and the in-flight promise is
// shared, so N instances cost one request.
//
// Entries expire after SHARED_TTL_MS so a long-lived single-page session
// (client-side routing) still picks up form edits, matching the 5 minute
// server-side cache in the headless plugin. Failures are dropped immediately so
// a later instance retries rather than inheriting the error.
const SHARED_TTL_MS = 5 * 60 * 1000;
const inflight = new Map();

export function sharedJson(key, request) {
  const existing = inflight.get(key);

  if (existing && Date.now() - existing.time < SHARED_TTL_MS) {
    return existing.promise;
  }

  const promise = Promise.resolve()
    .then(request)
    .catch((error) => {
      if (inflight.get(key)?.promise === promise) {
        inflight.delete(key);
      }
      throw error;
    });

  inflight.set(key, { promise, time: Date.now() });

  return promise;
}

// Deep copy of plain JSON data. structuredClone is unavailable in Safari < 15.4
// and other 2021-era browsers, so fall back to a JSON round-trip (the schema is
// plain JSON from the API, so nothing is lost).
export function cloneJson(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}
