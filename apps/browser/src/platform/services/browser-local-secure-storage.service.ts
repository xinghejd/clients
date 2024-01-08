import AbstractChromeStorageService from "./abstractions/abstract-chrome-storage-api.service";

export default class BrowserLocalSecureStorageService extends AbstractChromeStorageService {
  constructor() {
    super(chrome.storage.local);
  }
}
