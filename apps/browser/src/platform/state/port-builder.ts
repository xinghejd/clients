import { KeyDefinition } from "@bitwarden/common/platform/state";

export function portNameBuilder(keyDefinition: KeyDefinition<unknown>, scope: "user" | "global") {
  return `${keyDefinition.stateDefinition.name}_${scope}_${keyDefinition.key}_port`;
}
