// TODO: How can we protect the creation of these so that platform can maintain the allowed creations?

// TODO: Where should this live
export type StorageLocation = "disk" | "memory" | "secure";

/**
 *
 */
export class StateDefinition {
  /**
   *
   * @param name The name of the state, this needs to be unique from all other {@link StateDefinition}'s.
   * @param storageLocation The location of where this state should be stored.
   */
  constructor(
    readonly name: string,
    readonly storageLocation: StorageLocation
  ) { }
}
