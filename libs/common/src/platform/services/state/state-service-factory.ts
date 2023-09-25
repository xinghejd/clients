import { UserId } from "../../../types/guid";
import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "../../abstractions/storage.service";

import { NamespacedStateService } from "./namespaced-state-service";

export type StorageScope = "global" | UserId;
export type StorageLocation = "memory" | "disk" | "secure";

export class StateServiceFactory {
  private registeredNamespaces: string[] = [];

  constructor(
    private memoryStorageService: AbstractMemoryStorageService,
    private diskStorageService: AbstractStorageService,
    private secureStorageService: AbstractStorageService
  ) {}

  buildFor(namespace: string) {
    if (this.registeredNamespaces.includes(namespace)) {
      throw new Error(
        "Attempted to double-register a scope + namespace. This could result in data loss as multiple services handle writing to the same data location."
      );
    }

    this.registeredNamespaces.push(namespace);
    return new NamespacedStateService(
      namespace,
      this.memoryStorageService,
      this.diskStorageService,
      this.secureStorageService
    );
  }
}
