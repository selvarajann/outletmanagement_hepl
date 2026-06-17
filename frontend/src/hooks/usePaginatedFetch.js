import { useEffect, useState, useCallback, useRef } from "react";
import { DEFAULT_PAGE_SIZE } from "../constants/pagination";

export default function usePaginatedFetch(fetchFn, { page, filters, size = DEFAULT_PAGE_SIZE }) {
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  // Holds the controller for the currently in-flight request
  const controllerRef = useRef(null);

  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const refetch = useCallback(() => setRefetchTrigger((n) => n + 1), []);

  const filterKey = JSON.stringify(filters ?? {});

  useEffect(() => {
    // Abort any in-flight request immediately before starting a new one
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const { signal } = controllerRef.current;

    setLoading(true);

    // Strip null / undefined / empty-string params before sending to the API
    const rawParams = { page, size, ...filters };
    const cleanParams = Object.fromEntries(
      Object.entries(rawParams).filter(([, v]) => v !== null && v !== undefined && v !== "")
    );

    fetchFnRef.current(cleanParams, signal)
      .then((result) => {
        if (signal.aborted) return;
        setRows(result.rows);
        setTotalPages(result.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        if (
          signal.aborted ||
          err.name === "AbortError" ||
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) return;
        console.error("Fetch error:", err);
        setLoading(false);
      });

    return () => controllerRef.current?.abort();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, filterKey, refetchTrigger]);

  return { rows, totalPages, loading, refetch };
}
