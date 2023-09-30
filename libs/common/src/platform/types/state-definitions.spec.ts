import { StateDefinition } from "./state-definition";
import * as definitions from "./state-definitions";

it("has all unique definitions", () => {
  const uniqueNames: string[] = [];
  const keys = Object.keys(definitions);

  for (const key of keys) {
    const definition = (definitions as unknown as Record<string, StateDefinition>)[key];
    if (Object.getPrototypeOf(definition) !== StateDefinition.prototype) {
      throw new Error(`${key} from import ./state-definitions is expected to be a StateDefinition but wasn't.`);
    }

    const name = `${definition.name}_${definition.storageLocation}`;

    if (uniqueNames.includes(name)) {
      throw new Error(`Definition ${key} is invalid, it's elements have already been claimed. Please choose a unique name.`);
    }

    uniqueNames.push(name);
  }
});
