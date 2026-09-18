// Drop-in replacements for next/navigation's usePathname/useRouter/useSearchParams,
// backed by react-router-dom. Ported pages import these in place of next/navigation.
import { useMemo } from "react";
import { useLocation, useNavigate, useParams as useRouterParams } from "react-router-dom";

export function usePathname(): string {
  return useLocation().pathname;
}

export function useSearchParams(): URLSearchParams {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return useRouterParams() as T;
}

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => { /* no-op: no server components to re-render */ },
  };
}
