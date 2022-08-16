//Ripped from: https://dev.to/svehla/typescript-how-to-deep-merge-170c

type Head<T> = T extends [infer I, ...infer _Rest] ? I : never;
type Tail<T> = T extends [infer _I, ...infer Rest] ? Rest : never;

type Zip_DeepGenericMerge<T, U> = T extends []
  ? U
  : U extends []
  ? T
  : [DeepGenericMerge<Head<T>, Head<U>>, ...Zip_DeepGenericMerge<Tail<T>, Tail<U>>];

/**
 * Take two objects T and U and create the new one with uniq keys for T a U objectI
 * helper generic for `DeepGenericMerge`
 */
type GetObjDifferentKeys<T, U, T0 = Omit<T, keyof U> & Omit<U, keyof T>, T1 = { [K in keyof T0]: T0[K] }> = T1;
/**
 * Take two objects T and U and create the new one with the same objects keys
 * helper generic for `DeepGenericMerge`
 */
type GetObjSameKeys<T, U> = Omit<T | U, keyof GetObjDifferentKeys<T, U>>;

type MergeTwoObjects<
  T,
  U,
  T0 = GetObjDifferentKeys<T, U> & { [K in keyof GetObjSameKeys<T, U>]: DeepGenericMerge<T[K], U[K]> }, // shared keys are recursively resolved by `DeepGenericMerge<...>`
  T1 = { [K in keyof T0]: T0[K] },
> = T1;

// it merge 2 static types and try to avoid of unnecessary options (`'`)
export type DeepGenericMerge<T, U> =
  // ----- 2 added lines ------
  [T, U] extends [any[], any[]]
    ? Zip_DeepGenericMerge<T, U>
    : // check if generic types are objects
    [T, U] extends [{ [key: string]: unknown }, { [key: string]: unknown }]
    ? MergeTwoObjects<T, U>
    : T | U;
