import * as definitions from "./key-definitions";
import { StateDefinition } from "./state-definition";

it("has all unique state definitions", () => {
  const uniqueStateNames: string[] = [];
  const keys = Object.keys(definitions);

  for (const key of keys) {
    // This is not a true cast but we will skip any that don't match this signature so it's okay for a test.
    const stateDefinition = (definitions as unknown as Record<string, StateDefinition>)[key];
    if (Object.getPrototypeOf(stateDefinition) !== StateDefinition.prototype) {
      // We will check only the StateDefinitions here
      continue;
    }

    // This could also be where we test any rules about state definition names we might want
    // ex. no numbers, snake_case, should or should not include `service`

    const stateName = `${stateDefinition.name}_${stateDefinition.storageLocation}`;

    if (uniqueStateNames.includes(stateName)) {
      throw new Error(
        `Definition ${key} is invalid, its elements have already been claimed. Please choose a unique name.`
      );
    }

    uniqueStateNames.push(stateName);
  }
});
