/**
 * need to update test environment so structuredClone works appropriately
 * @jest-environment ../shared/test.environment.ts
 */

import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, of } from "rxjs";

import { makeEncString, makeSymmetricCryptoKey, ObservableTracker } from "../../../../spec";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { Utils } from "../../../platform/misc/utils";
import { FolderId } from "../../../types/guid";
import { UserKey } from "../../../types/key";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderView } from "../../models/view/folder.view";

import { FolderEncryptor } from "./folder.encryptor";

describe("FolderEncryptor", () => {
  let sut: FolderEncryptor;
  let encryptService: MockProxy<EncryptService>;
  const userKey = makeSymmetricCryptoKey(64) as UserKey;
  let userKeySubject: BehaviorSubject<UserKey>;
  const folderView = FolderView.fromJSON({
    id: Utils.newGuid() as FolderId,
    name: "folder name",
    revisionDate: new Date().toJSON(),
  });
  const folderData = new FolderData({
    id: folderView.id,
    name: makeEncString(folderView.name).toJSON(),
    revisionDate: new Date().toJSON(),
  });
  const folder = new Folder(folderData);

  beforeEach(() => {
    userKeySubject = new BehaviorSubject(userKey);

    encryptService = mock<EncryptService>();

    sut = new FolderEncryptor(encryptService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  function setUpCryptography() {
    encryptService.encrypt.mockImplementation((value) => {
      let data: string;
      if (typeof value === "string") {
        data = value;
      } else {
        data = Utils.fromBufferToUtf8(value);
      }

      return Promise.resolve(makeEncString(data));
    });

    encryptService.decryptToUtf8.mockImplementation((value) => {
      return Promise.resolve(value.data);
    });

    encryptService.decryptToBytes.mockImplementation((value) => {
      return Promise.resolve(value.dataBytes);
    });
  }

  describe("encryptFolder", () => {
    it("encrypts folder", async () => {
      setUpCryptography();

      const tracker = new ObservableTracker(of(folderView).pipe(sut.encryptFolder(userKeySubject)));

      const [result] = await tracker.pauseUntilReceived(1);

      expect(result).toEqual(folder);
    });

    it("encrypts the folder with the user key", async () => {
      setUpCryptography();

      const tracker = new ObservableTracker(of(folderView).pipe(sut.encryptFolder(userKeySubject)));

      await tracker.pauseUntilReceived(1);

      for (const call of encryptService.encrypt.mock.calls) {
        expect(call[1]).toEqual(userKey);
      }
    });
  });

  describe("decryptFolder", () => {
    it("decrypts folder", async () => {
      setUpCryptography();

      const tracker = new ObservableTracker(of(folderData).pipe(sut.decryptFolder(userKeySubject)));

      const [result] = await tracker.pauseUntilReceived(1);

      expect(result).toEqual(folderView);
    });

    it("returns null if folder is null", async () => {
      setUpCryptography();

      const tracker = new ObservableTracker(of(null).pipe(sut.decryptFolder(userKeySubject)));

      const [result] = await tracker.pauseUntilReceived(1);

      expect(result).toEqual(null);
    });
  });
});
