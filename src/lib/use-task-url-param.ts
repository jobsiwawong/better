"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Opens a task modal when the URL carries `?task=<id>` (e.g. from a search
 * result), then strips the param so the URL stays clean and the same task can
 * be reopened later. Card/row clicks keep using the returned setter directly.
 */
export function useTaskUrlParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramTaskId = searchParams.get("task");

  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [seenParam, setSeenParam] = React.useState<string | null | undefined>(
    undefined
  );

  // Adjust state during render when the param changes (React-endorsed pattern),
  // so a new/changed `task` param opens the corresponding modal.
  if (paramTaskId !== seenParam) {
    setSeenParam(paramTaskId);
    if (paramTaskId) setSelectedTaskId(paramTaskId);
  }

  React.useEffect(() => {
    if (paramTaskId) router.replace(pathname, { scroll: false });
  }, [paramTaskId, pathname, router]);

  return [selectedTaskId, setSelectedTaskId] as const;
}
