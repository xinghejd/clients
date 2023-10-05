import { KeyDefinition } from "../state/key-definition";

// TODO: Use Matts `UserId` type
export function userKeyBuilder(userId: string, keyDefinition: KeyDefinition<unknown>): string {
  if (userId == null) {
    throw new Error("You cannot build a user key without");
  }
  return `${keyDefinition.stateDefinition.name}_${userId}_${keyDefinition.key}`;
}

export function globalKeyBuilder(keyDefinition: KeyDefinition<unknown>): string {
  // TODO: Do we want the _global_ part?
  return `${keyDefinition.stateDefinition.name}_global_${keyDefinition.key}`;
}
