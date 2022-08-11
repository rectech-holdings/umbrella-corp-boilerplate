import { useRef, useState } from "react";

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type DistributivePartial<T> = T extends unknown ? Partial<T> : never;
// Creates a partial of ALL possible types in a conditional union. E.g. CollapseConditionalType<{x: 1} | {z: 1}> is the same as {x?: 1, z?: 1}
export type DeepPartial<T> = UnionToIntersection<DistributivePartial<T>>;

export const EMAIL_REGEX = /^[^@]+@[^@]+\.[^@]{2,10}$/;

export const LINK_REGEX =
  /\b(https?:\/\/)?(([-a-z0-9_]{2,50}\.))+[a-zA-Z0-9]{2,6}\b([-a-zA-Z0-9()@:%_\+.~#?$!&/=]*)(\b)?/im;

let id = 1;
export function useId() {
  const idRef = useRef<number>();
  if (!idRef.current) {
    idRef.current = id++;
  }
  return idRef.current.toString();
}
