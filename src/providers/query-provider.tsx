"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode } from "react";

/**
 * Creates a new QueryClient with default options tailored for Next.js App Router SSR.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR safe: 1 minute staleTime prevents redundant refetching right after hydration
        staleTime: 60 * 1000,
        // Garbage collection time (cache retention)
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Singleton QueryClient retriever for browser; fresh client for SSR requests.
 * Prevents cross-request data leaks on the server as per TanStack Query docs.
 */
export function getQueryClient(): QueryClient {
  const isServer = typeof window === "undefined";
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

export interface QueryProviderProps {
  children: ReactNode;
}

/**
 * Root TanStack Query Provider for SafarX Next.js application.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
