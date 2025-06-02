// Custom hook using SWR for API data fetching and caching

import useSWR from "swr";
import axios from "./axios";

/**
 * Fetcher function for SWR using axios GET request
 */
export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await axios.get<T>(url);
  return response.data;
};

/**
 * Custom hook to fetch and cache API data using SWR
 */
export function useApi<T>(key: string, url?: string) {
  const urlKey = url || key;

  // useSWR handles fetching, caching, and revalidation
  const { data, error, isLoading, mutate } = useSWR<T>(
    urlKey,
    () => fetcher<T>(urlKey),
    {
      revalidateOnFocus: false, // Disable revalidation on window focus
    },
  );

  return { data, error, isLoading, mutate };
}
