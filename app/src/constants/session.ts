export const SESSION_EXPIRED_EVENT = 'rankstack:session-expired';
export const SESSION_REFRESH_INTERVAL_MS = 5 * 60 * 1_000;
// Upper bound on the proxy's background session-refresh lookup so a stalled
// session service never delays returning an already-successful upstream response.
export const SESSION_REFRESH_FETCH_TIMEOUT_MS = 3_000;
