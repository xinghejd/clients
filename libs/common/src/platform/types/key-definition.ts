import { Jsonify } from "type-fest";

import { DeriveContext, DerivedStateDefinition } from "./derived-state-definition";
import { StateDefinition, StorageLocation } from "./state-definition";

/**
 *
 */
// TODO Import Purpose type
export class KeyDefinition<T> {
  /**
   * Creates a new instance of a KeyDefinition
   * @param stateDefinition The state definition for which this key belongs to.
   * @param key The name of the key, this should be unique per domain
   * @param serializer A function to use to safely convert your type from json to your expected type.
   */
  constructor(
    readonly stateDefinition: StateDefinition,
    readonly key: string,
    readonly serializer: (jsonValue: Jsonify<T>) => T
  ) {}

  static array<T>(
    stateDefinition: StateDefinition,
    key: string,
    serializer: (jsonValue: Jsonify<T>) => T
  ) {
    return new KeyDefinition<T[]>(stateDefinition, key, (jsonValue) => {
      // TODO: Should we handle null for them, I feel like we should discourage null for an array?
      return jsonValue.map((v) => serializer(v));
    });
  }

  static record<T>(
    stateDefinition: StateDefinition,
    key: string,
    serializer: (jsonValue: Jsonify<T>) => T
  ) {
    return new KeyDefinition<Record<string, T>>(stateDefinition, key, (jsonValue) => {
      const output: Record<string, T> = {};
      for (const key in jsonValue) {
        output[key] = serializer((jsonValue as Record<string, Jsonify<T>>)[key]);
      }
      return output;
    });
  }

  /**
   * Helper for defining a derived definition that will often be used alongside a given key
   * @param storageLocation
   * @param decrypt
   * @returns
   */
  createDerivedDefinition<TTo>(
    storageLocation: StorageLocation,
    decrypt: (data: T, context: DeriveContext) => Promise<TTo>
  ) {
    return new DerivedStateDefinition(storageLocation, decrypt);
  }
}
