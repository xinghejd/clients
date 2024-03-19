import { Opaque } from "type-fest";

export type StorageKey = Opaque<string, "StorageKey">;

export type DerivedStateDependencies<TTo> = {
  previousState?: TTo;
  [key: string]: unknown;
};
