import { MonoTypeOperatorFunction, identity } from "rxjs";

import { StorageUpdate } from "@bitwarden/common/platform/abstractions/storage.service";

import AbstractChromeStorageService from "./abstractions/abstract-chrome-storage-api.service";

export default class BrowserMemoryStorageService extends AbstractChromeStorageService {
  constructor(updatesCustomizer: MonoTypeOperatorFunction<StorageUpdate> = identity) {
    super(chrome.storage.session, updatesCustomizer);
  }
}
