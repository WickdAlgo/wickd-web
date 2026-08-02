"use client";
import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Replay state, in the URL.
 *
 * The handoff asks for shareable, reproducible inspection addresses, which
 * means the cursor and mode have to survive a copy-paste. The URL is therefore
 * the source of truth and React state is derived from it, not the other way
 * round — the opposite arrangement drifts the moment the user presses Back.
 *
 * `replace` rather than `push`: dragging a slider should not bury the previous
 * page under a hundred history entries.
 */

export interface ReplayUrlState {
  mode: "final" | "causal";
  step: number;
  selectedEntityId: string | null;
  hiddenLayerIds: readonly string[];
}

export interface ReplayUrlActions {
  setMode(mode: "final" | "causal"): void;
  setStep(step: number): void;
  setSelectedEntityId(id: string | null): void;
  toggleLayer(id: string, visible: boolean): void;
}

export function useReplayUrlState(): ReplayUrlState & ReplayUrlActions {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const mode = params.get("view") === "causal" ? "causal" : "final";
  const stepRaw = Number(params.get("step"));
  const step = Number.isFinite(stepRaw) && stepRaw >= 0 ? Math.floor(stepRaw) : 0;
  const selectedEntityId = params.get("selected");
  const hiddenLayerIds = React.useMemo(() => {
    const raw = params.get("hidden");
    return raw ? raw.split(",").filter(Boolean) : [];
  }, [params]);

  const commit = React.useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return {
    mode,
    step,
    selectedEntityId,
    hiddenLayerIds,

    setMode: React.useCallback(
      (value) =>
        commit((next) => {
          if (value === "final") {
            next.delete("view");
            next.delete("step");
          } else {
            next.set("view", "causal");
          }
        }),
      [commit],
    ),

    setStep: React.useCallback(
      (value) =>
        commit((next) => {
          next.set("view", "causal");
          next.set("step", String(value));
        }),
      [commit],
    ),

    setSelectedEntityId: React.useCallback(
      (id) =>
        commit((next) => {
          if (id === null) next.delete("selected");
          else next.set("selected", id);
        }),
      [commit],
    ),

    toggleLayer: React.useCallback(
      (id, visible) =>
        commit((next) => {
          const hidden = new Set(
            (next.get("hidden") ?? "").split(",").filter(Boolean),
          );
          if (visible) hidden.delete(id);
          else hidden.add(id);
          if (hidden.size === 0) next.delete("hidden");
          else next.set("hidden", [...hidden].join(","));
        }),
      [commit],
    ),
  };
}
