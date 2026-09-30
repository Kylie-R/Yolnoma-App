import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "@/features/auth/AuthContext";
import { ToastProvider } from "@/shared/ui/Toast";
import { ContextMenuProvider } from "@/app/components/ContextMenu";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <HashRouter>
            <ContextMenuProvider>{children}</ContextMenuProvider>
          </HashRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export { queryClient };
