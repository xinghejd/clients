import { Subject } from "rxjs";

import { AbstractMemoryStorageService, StorageUpdate } from "../abstractions/storage.service";

export class MemoryStorageService extends AbstractMemoryStorageService {
  protected store = new Map<string, unknown>();
  private updatesSubject = new Subject<StorageUpdate>();

  get valuesRequireDeserialization(): boolean {
    return false;
  }
  get updates$() {
    return this.updatesSubject.asObservable();
  }

  get<T>(key: string): Promise<T> {
    if (this.store.has(key)) {
      const obj = this.store.get(key);
      return Promise.resolve(obj as T);
    }
    return Promise.resolve(null);
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) != null;
  }

  save<T>(key: string, obj: T): Promise<void> {
    if (obj == null) {
      return this.remove(key);
    }
    // TODO: Remove once foreground/background contexts are separated in browser
    // Needed to ensure ownership of all memory by the context running the storage service
    const toStore = clone(obj);
    this.store.set(key, toStore);
    this.updatesSubject.next({ key, updateType: "save" });
    return Promise.resolve();
  }

  remove(key: string): Promise<void> {
    this.store.delete(key);
    this.updatesSubject.next({ key, updateType: "remove" });
    return Promise.resolve();
  }

  getBypassCache<T>(key: string): Promise<T> {
    return this.get<T>(key);
  }
}

function clone<T>(obj: T): T {
  const clone = structuredClone(obj);
  return setPrototypes(obj, clone);
}

function setPrototypes<T>(original: T, clone: T): T {
  if (typeof original !== "object" || original == null) {
    return clone;
  }

  // return if prototype is already set
  if (Object.getPrototypeOf(clone) === Object.getPrototypeOf(original)) {
    return clone;
  }

  Object.setPrototypeOf(clone, Object.getPrototypeOf(original));
  // recurse into properties to set prototypes
  for (const prop in original) {
    if (Object.prototype.hasOwnProperty.call(original, prop)) {
      clone[prop] = setPrototypes(original[prop], clone[prop]);
    }
  }
  return clone;
}
