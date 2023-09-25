import {
  AbstractMemoryStorageService,
  AbstractStorageService,
} from "../../abstractions/storage.service";
import { Utils } from "../../misc/utils";

import { StorageLocation, StorageScope } from "./state-service-factory";

export class NamespacedStateService {
  constructor(
    protected namespace: string,
    private memoryStorageService: AbstractMemoryStorageService,
    private diskStorageService: AbstractStorageService,
    private secureStorageService: AbstractStorageService
  ) {}

  /**
   * Validates the namespace of the service prior to get or set of a value.
   * Overridden in extension classes to allow for throwing if namespace mutates to an invalid value for storage
   * @returns void
   */
  protected validateNamespace() {
    return;
  }

  // TODO MDG: Handle key suffix and html storage location
  async get<T>(scope: StorageScope, key: string, location: StorageLocation) {
    key = this.resolveKey(scope, key);
    return await this.resolveLocation(location).get<T>(key);
  }

  async has(scope: StorageScope, key: string, location: StorageLocation) {
    key = this.resolveKey(scope, key);
    return await this.resolveLocation(location).has(key);
  }

  async save<T>(scope: StorageScope, key: string, obj: T, location: StorageLocation) {
    key = this.resolveKey(scope, key);
    return await this.resolveLocation(location).save<T>(key, obj);
  }

  private resolveLocation(location: StorageLocation): AbstractStorageService {
    let storageService: AbstractStorageService;
    switch (location) {
      case "memory":
        storageService = this.memoryStorageService;
        break;
      case "disk":
        storageService = this.diskStorageService;
        break;
      case "secure":
        storageService = this.secureStorageService;
        break;
      default:
        throw new Error(`Unknown storage location, ${location ?? "NULL"}`);
    }
    return storageService;
  }

  private resolveKey(scope: StorageScope, key: string): string {
    if (scope === "global") {
      return `${this.namespace}_${key}`;
    }

    if (!Utils.isGuid(scope)) {
      throw new Error(`Invalid scope provided: ${scope}. Must be a valid GUID.`);
    }

    return `${scope}_${this.namespace}_${key}`;
  }
}
