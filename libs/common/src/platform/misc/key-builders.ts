import { KeyDefinition } from "../types/key-definition";

// TODO: Use Matt's `UserId` type
export function userKeyBuilder(
  userId: string,
  keyDefinition: KeyDefinition<unknown>
): string {
  return `${keyDefinition.stateDefinition.name}_${userId}_${keyDefinition.key}`;
}

export function globalKeyBuilder(
  keyDefinition: KeyDefinition<unknown>
): string {
  // TODO: Do we want the _global_ part?
  return `${keyDefinition.stateDefinition.name}_global_${keyDefinition.key}`;
}
