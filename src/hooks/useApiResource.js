import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Shared data-fetching hook for the admin list views.
 *
 * Every list view here (Users, Vendors, Bookings, Blogs, ...) independently
 * reimplemented the same loading/error/page/hasMore state and
 * fetch-in-useEffect wiring, each with small drift (e.g. BookingsView used
 * `totalCount = data.length` as if it were a real total and never actually
 * paginated past page 1; VendorsView/UsersView correctly inferred `hasMore`
 * from whether the page came back full). This is the one canonical
 * implementation all of them now share.
 *
 * @param {(page: number) => Promise<any[]>} fetchPage - called with the
 *   current page number; must resolve to a plain array. Every admin API
 *   module (services/*Api.js) already normalizes to this shape. A new
 *   function identity on every render is fine -- only `deps` and `page`
 *   decide when a fetch actually runs.
 * @param {any[]} [deps] - dependency array (e.g. [filter, searchQuery]).
 *   Changing any value here resets to page 1, mirroring the "changing the
 *   filter must return to page 1" comment repeated in every view before
 *   this hook existed -- otherwise switching filters while on page 3 asks
 *   for page 3 of the new, likely shorter, result set and renders empty.
 * @param {object} [options]
 * @param {number} [options.pageSize=10] - page size every view here uses.
 * @param {number} [options.debounceMs=0] - delay before fetching after a
 *   `deps` or `page` change (BookingsView debounced its search input by
 *   500ms; most views don't debounce at all).
 */
export function useApiResource(fetchPage, deps = [], { pageSize = 10, debounceMs = 0 } = {}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Kept as its own effect, same as every view did individually, so a page
  // change and a deps change don't both drive page state in the same place.
  useEffect(() => {
    setPage(1);
    // deps is caller-controlled and intentionally spread here -- this must
    // re-run exactly when the caller's own dependency values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // fetchPage closes over view-local values (filter, searchQuery) that are
  // already covered by `deps`; a ref avoids re-running the fetch effect
  // purely because the caller passed a new function identity this render.
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchPageRef.current(page);
      const list = Array.isArray(result) ? result : [];
      setData(list);
      // No admin list endpoint returns a total count -- "is there a next
      // page" is inferred from whether this page came back full, the same
      // convention every view used individually before this hook existed.
      setHasMore(list.length === pageSize);
    } catch (err) {
      setError(err?.message || 'Failed to load data');
      setData([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (debounceMs > 0) {
      const timer = setTimeout(refetch, debounceMs);
      return () => clearTimeout(timer);
    }
    refetch();
    // refetch already depends on [page, pageSize]; deps is spread so a
    // filter/search change (which also resets page via the effect above)
    // still triggers a fetch on its own if page was already 1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, debounceMs, ...deps]);

  return { data, loading, error, page, setPage, hasMore, refetch };
}
