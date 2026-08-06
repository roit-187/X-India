// Next's catch-all route params ([...path]) are per-segment URL-decoded by
// the framework, but a single segment can still contain a literal "/" if the
// client percent-encoded it (e.g. "..%2f..%2fauth%2Flogin" arrives as ONE
// segment: "../../auth/login"). If that decoded string is then joined and
// concatenated into a backend URL, the WHATWG URL parser resolves ".." against
// the path, letting a request escape the intended /api/v1/admin/ (or
// /api/seller/) prefix and reach arbitrary backend routes. Reject any segment
// containing a literal slash/backslash or a bare "." / ".." before it's ever
// joined into a URL.
export function isSafePathSegments(segments) {
  return (
    Array.isArray(segments) &&
    segments.every(
      (seg) =>
        typeof seg === 'string' &&
        seg.length > 0 &&
        seg !== '.' &&
        seg !== '..' &&
        !seg.includes('/') &&
        !seg.includes('\\')
    )
  );
}
