// Module-level request sharing.
//
// A page often mounts the same form more than once (e.g. a signup strip in the
// content and the same form in the footer), and every instance used to fetch the
// form schema and the reCAPTCHA config on its own. Requests are keyed on what
// makes them unique (endpoint, form id, API key) and the in-flight promise is
// shared, so N instances cost one request. Failures are dropped from the map so
// a later instance retries rather than inheriting the error.
const inflight = new Map();

export function sharedJson(key, request) {
  if (!inflight.has(key)) {
    inflight.set(
      key,
      Promise.resolve()
        .then(request)
        .catch((error) => {
          inflight.delete(key);
          throw error;
        })
    );
  }

  return inflight.get(key);
}
