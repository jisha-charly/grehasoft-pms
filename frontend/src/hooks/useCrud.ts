import { useState, useCallback, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

/** Normalize list API response (handles results/count or data array) */
function normalizeListResponse(res: any): { results: any[]; count: number } {
  const data = res?.data;
  if (!data) return { results: [], count: 0 };
  
  let results = data.results ?? data.data ?? (Array.isArray(data) ? data : []);
  const count = typeof data.count === "number" ? data.count : (results?.length ?? 0);
  
  const normalizedResults = (Array.isArray(results) ? results : []).map((item: any) => {
    if (item && typeof item === 'object') {
      return {
        ...item,
        id: item.id ?? item.user_id,
      };
    }
    return item;
  });
  
  return { results: normalizedResults, count };
}

/** Normalize single item from POST/PATCH response */
function normalizeItemResponse(res: any): any {
  const data = res?.data;
  if (!data) return data;
  const item = data.data ?? data;
  if (item && typeof item === 'object') {
    return {
      ...item,
      id: item.id ?? item.user_id,
    };
  }
  return item;
}

export interface UseCrudOptions<T> {
  /** Base API path, e.g. "/clients" (no trailing slash) */
  endpoint: string;
  /** Page size for pagination (default 5) */
  pageSize?: number;
  /** Fetch list on mount (default true) */
  fetchOnMount?: boolean;
  /** Only run when authenticated (default true) */
  enabled?: boolean;
  /** Optional query params merged into every list fetch (e.g. { search: "..." }) */
  queryParams?: Record<string, string | number | undefined>;
}

export interface UseCrudPagination {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export interface UseCrudReturn<T> {
  /** Current page items */
  items: T[];
  /** Replace items (e.g. after refetch) */
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  /** Loading list */
  loading: boolean;
  /** List fetch error */
  error: string | null;
  /** Pagination state and controls */
  pagination: UseCrudPagination;
  /** Re-fetch current page (or with custom params). Alias: getAll */
  refetch: (params?: Record<string, string | number | undefined> | string) => Promise<{ results: T[]; count: number }>;
  /** Get one by id */
  getOne: (id: number | string) => Promise<T | null>;
  /** Create and append to list */
  add: (payload: Partial<T> | Record<string, unknown>) => Promise<T>;
  /** Update by id and refresh list item */
  update: (id: number | string, payload: Partial<T> | Record<string, unknown>) => Promise<T>;
  /** Delete by id and remove from list. Alias: remove */
  delete: (id: number | string) => Promise<void>;
  /** Delete by id (alias for delete) */
  remove: (id: number | string) => Promise<void>;
  /** Backward-compat: same as refetch (returns { results, count }) */
  getAll: (params?: Record<string, string | number | undefined> | string) => Promise<{ results: T[]; count: number }>;
}

const DEFAULT_PAGE_SIZE = 5;

export function useCrud<T extends { id?: number | string }>(options: UseCrudOptions<T>): UseCrudReturn<T> {
  const {
    endpoint,
    pageSize = DEFAULT_PAGE_SIZE,
    fetchOnMount = true,
    enabled = true,
    queryParams,
  } = options;

  const base = endpoint.replace(/\/$/, "");
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const refetch = useCallback(
    async (params?: Record<string, string | number | undefined> | string): Promise<{ results: T[]; count: number }> => {
      if (!enabled) return { results: [], count: 0 };
      setLoading(true);
      setError(null);
      try {
        const merged = {
          page: String(page),
          ...queryParams,
          ...(typeof params === "object" && params !== null ? params : {}),
          _t: Date.now(),
        };
        const query =
          typeof params === "string"
            ? params.replace(/^\?/, "")
            : new URLSearchParams(
                Object.entries(merged)
                  .filter(([_, v]) => v !== undefined && v !== "")
                  .map(([k, v]) => [k, String(v)] as [string, string])
              ).toString();
        const url = query ? `${base}/?${query}` : `${base}/`;
        const res = await axiosInstance.get(url);
        const { results, count } = normalizeListResponse(res);
        setItems(results as T[]);
        setTotalCount(count);
        if (typeof params === "object" && params?.page !== undefined) {
          setPage(Number(params.page));
        }
        return { results: results as T[], count };
      } catch (err: any) {
        const message = err?.response?.data?.message ?? err?.message ?? "Failed to fetch";
        setError(message);
        setItems([]);
        setTotalCount(0);
        return { results: [], count: 0 };
      } finally {
        setLoading(false);
      }
    },
    [base, enabled, page, JSON.stringify(queryParams ?? {})]
  );

  const getOne = useCallback(
    async (id: number | string): Promise<T | null> => {
      try {
        const res = await axiosInstance.get(`${base}/${id}/`);
        return normalizeItemResponse(res) as T;
      } catch {
        return null;
      }
    },
    [base]
  );

  const add = useCallback(
    async (payload: Partial<T> | Record<string, unknown>): Promise<T> => {
      const res = await axiosInstance.post(`${base}/`, payload);
      const newItem = normalizeItemResponse(res) as T;
      if (newItem && !newItem.id && (newItem as any).user_id) {
        newItem.id = (newItem as any).user_id;
      }
      setItems((prev) => [...prev, newItem]);
      setTotalCount((c) => c + 1);
      return newItem;
    },
    [base]
  );

  const update = useCallback(
    async (id: number | string, payload: Partial<T> | Record<string, unknown>): Promise<T> => {
      const res = await axiosInstance.patch(`${base}/${id}/`, payload);
      const updated = normalizeItemResponse(res) as T;
      if (updated && !updated.id) {
        updated.id = id;
      }
      setItems((prev) =>
        prev.map((i) => {
          const currentId = i.id ?? (i as any).user_id;
          return String(currentId) === String(id) ? { ...i, ...updated } : i;
        })
      );
      return updated;
    },
    [base]
  );

  const remove = useCallback(
    async (id: number | string): Promise<void> => {
      await axiosInstance.delete(`${base}/${id}/`);
      setItems((prev) => prev.filter((i) => {
        const currentId = i.id ?? (i as any).user_id;
        return String(currentId) !== String(id);
      }));
      setTotalCount((c) => Math.max(0, c - 1));
    },
    [base]
  );

  useEffect(() => {
    if (!enabled || !fetchOnMount) return;
    refetch({ page, ...queryParams });
  }, [enabled, fetchOnMount, page, JSON.stringify(queryParams ?? {})]);

  return {
    items,
    setItems,
    loading,
    error,
    pagination: {
      page,
      setPage,
      totalPages,
      totalCount,
      pageSize,
    },
    refetch,
    getOne,
    add,
    update,
    delete: remove,
    remove,
    getAll: refetch,
  };
}
