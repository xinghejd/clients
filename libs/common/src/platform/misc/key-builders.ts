import { Opaque } from "type-fest";

import { KeyDefinition } from "../state/key-definition";

export type StorageKey = Opaque<string, "StorageKey">;

// TODO: Use Matts `UserId` type
export function userKeyBuilder(userId: string, keyDefinition: KeyDefinition<unknown>): StorageKey {
  if (userId == null) {
    throw new Error("You cannot build a user key without");
  }
  return `${keyDefinition.stateDefinition.name}_${userId}_${keyDefinition.key}` as StorageKey;
}

export function globalKeyBuilder(keyDefinition: KeyDefinition<unknown>): StorageKey {
  // TODO: Do we want the _global_ part?
  return `${keyDefinition.stateDefinition.name}_global_${keyDefinition.key}` as StorageKey;
}
