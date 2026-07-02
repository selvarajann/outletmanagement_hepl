/**
 * Shared React Query hooks for master data (divisions, locations, outlets).
 *
 * All components that previously fetched these independently now share a
 * single cached request per query key. Subsequent mounts within staleTime
 * (5 min) return the cached value with zero network requests.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GetDivisions } from "../services/DivisionService";
import { GetLocations } from "../services/LocationService";
import { GetOutlets } from "../services/OutletService";
import { GetProducts } from "../services/ProductService";

const BIG = 1000;

export const QUERY_KEYS = {
  divisions: ["master", "divisions"],
  locations: ["master", "locations"],
  outlets:   ["master", "outlets"],
  products:  ["master", "products"],
};

export function useDivisions() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.divisions,
    queryFn: () => GetDivisions({ page: 0, size: BIG }).then((r) => r.divisions),
  });
  return { divisions: data ?? [], loading: isLoading };
}

export function useLocations() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.locations,
    queryFn: () => GetLocations({ page: 0, size: BIG }).then((r) => r.locations),
  });
  return { locations: data ?? [], loading: isLoading };
}

export function useOutlets() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.outlets,
    queryFn: () => GetOutlets({ page: 0, size: BIG }).then((r) => r.outlets),
  });
  return { outlets: data ?? [], loading: isLoading };
}

export function useProducts() {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.products,
    queryFn: () => GetProducts({ page: 0, size: BIG }).then((r) => r.products),
  });
  return { products: data ?? [], loading: isLoading };
}

export function invalidateMaster(queryClient, key) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS[key] });
}
