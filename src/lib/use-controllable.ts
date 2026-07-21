"use client";
import React from "react";

/**
 * State that defers to a controlled prop when one is provided,
 * mirroring the native checked/defaultChecked contract.
 */
export function useControllable<T>(controlled: T | undefined, fallback: T) {
  const [internal, setInternal] = React.useState(fallback);
  return [controlled !== undefined ? controlled : internal, setInternal] as const;
}
