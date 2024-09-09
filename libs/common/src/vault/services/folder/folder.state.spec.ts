/**
 * need to update test environment so structuredClone works appropriately
 * @jest-environment ../shared/test.environment.ts
 */

import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, map, Subject } from "rxjs";

import {
  FakeSingleUserState,
  makeEncString,
  makeSymmetricCryptoKey,
  ObservableTracker,
} from "../../../../spec";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { Utils } from "../../../platform/misc/utils";
import { EncString } from "../../../platform/models/domain/enc-string";
import { FolderId, UserId } from "../../../types/guid";
import { UserKey } from "../../../types/key";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderView } from "../../models/view/folder.view";

import { FolderEncryptor } from "./folder.encryptor";
import { FolderState } from "./folder.state";
import { NewFolderApiService } from "./new-folder-api.service";

describe("FolderState", () => {
  const userId = Utils.newGuid() as UserId;
  const userKey = makeSymmetricCryptoKey(64) as UserKey;
  let userKeySubject: BehaviorSubject<UserKey>;
  const folderId = Utils.newGuid() as FolderId;
  let singleUserState: FakeSingleUserState<Record<FolderId, FolderData>>;
  let cryptoService: MockProxy<CryptoService>;
  let folderApiService: MockProxy<NewFolderApiService>;
  let folderEncryptor: MockProxy<FolderEncryptor>;
  let destroy$: Subject<void>;
  let sut: FolderState;

  beforeEach(() => {
    singleUserState = new FakeSingleUserState(userId, {});
    cryptoService = mock<CryptoService>();
    userKeySubject = new BehaviorSubject(userKey);
    cryptoService.userKey$.mockReturnValue(userKeySubject);
    folderApiService = mock<NewFolderApiService>();
    folderEncryptor = mock<FolderEncryptor>();
    destroy$ = new Subject<void>();

    setUpCryptography(folderEncryptor);

    sut = new FolderState(
      folderId,
      singleUserState,
      cryptoService,
      folderApiService,
      folderEncryptor,
      destroy$,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    userKeySubject.complete();
    destroy$.next();
    destroy$.complete();
  });

  it("streams decrypted values", async () => {
    // TODO: This really only needs to test the pipe on the `state$` observable
    const expected = FolderView.fromJSON({
      id: folderId,
      name: "folder name",
      revisionDate: new Date().toJSON(),
    });

    const folderData = new FolderData({
      id: expected.id,
      name: makeEncString("folder name").toJSON(),
      revisionDate: expected.revisionDate.toJSON(),
    });
    const tracker = new ObservableTracker(sut.state$);

    singleUserState.nextState({ [folderData.id]: folderData });

    const result = await tracker.pauseUntilReceived(2);

    expect(result).toEqual([null, expected]);
  });

  it("exposes userId from singleUserState", () => {
    expect(sut.userId).toEqual(singleUserState.userId);
    expect(sut.userId).toEqual(userId);
  });

  describe("update", () => {
    const folderView = FolderView.fromJSON({
      id: folderId,
      name: "folder name",
      revisionDate: new Date().toJSON(),
    });
    const folderData = new FolderData({
      id: folderView.id,
      name: makeEncString(folderView.name).toJSON(),
      revisionDate: folderView.revisionDate.toJSON(),
    });

    it("throws if folder is deleted", async () => {
      setUpApi(folderApiService);
      const tracker = new ObservableTracker(sut.update(map(() => null)));

      const [error] = await tracker.pauseUntilErrorsReceived(1);

      expect(error).toEqual(
        new Error("Folder deleted in update method, use the delete method instead"),
      );
    });

    it("encrypts the folder before sending it to the API", async () => {
      setUpApi(folderApiService);
      let keyTracker: ObservableTracker<UserKey>;
      folderEncryptor.encryptFolder.mockImplementation((key$) => {
        keyTracker = new ObservableTracker(key$);
        return map((f) => {
          return new Folder({
            id: f.id,
            name: makeEncString(f.name).toJSON(),
            revisionDate: f.revisionDate.toJSON(),
          });
        });
      });

      singleUserState.nextState({ [folderData.id]: folderData });

      const tracker = new ObservableTracker(sut.update(map((f) => f)));

      await tracker.expectEmission();

      const [key] = await keyTracker.pauseUntilReceived(1);
      expect(key.keyB64).toEqual(userKey.keyB64);
    });

    it("uses the same user key even if it changes during the update", async () => {
      setUpApi(folderApiService);
      let keyTracker: ObservableTracker<UserKey>;
      folderEncryptor.encryptFolder.mockImplementation((key$) => {
        keyTracker = new ObservableTracker(key$);
        return map((f) => {
          return new Folder({
            id: f.id,
            name: makeEncString(f.name).toJSON(),
            revisionDate: f.revisionDate.toJSON(),
          });
        });
      });

      singleUserState.nextState({ [folderData.id]: folderData });

      const tracker = new ObservableTracker(
        sut.update(
          map((f) => {
            userKeySubject.next(makeSymmetricCryptoKey(64, 1));
            return f;
          }),
        ),
      );

      await tracker.expectEmission();

      const [key] = await keyTracker.pauseUntilReceived(1);
      expect(key.keyB64).toEqual(userKey.keyB64);
    });

    it("updates server with the encrypted value when updating a cipher", async () => {
      setUpApi(folderApiService);
      singleUserState.nextState({ [folderData.id]: folderData });

      const tracker = new ObservableTracker(sut.update((f) => f));

      await tracker.expectEmission(100);

      expect(folderApiService.updateFolderWithServer).toHaveBeenCalledWith(folderId);
    });

    it("updates disk state with the value returned from the api", async () => {
      const expectedNewFolderData = new FolderData({
        id: folderId,
        name: makeEncString("Has Been Saved To API").toJSON(),
        revisionDate: new Date().toJSON(),
      });
      setUpApi(folderApiService, expectedNewFolderData);
      singleUserState.nextState({ [folderData.id]: folderData });

      const tracker = new ObservableTracker(sut.update(map((f) => f)));

      await tracker.expectEmission();

      expect(singleUserState.nextMock).toHaveBeenCalledWith({
        [expectedNewFolderData.id]: expectedNewFolderData,
      });
    });

    it("returns the new decrypted value returned by the API", async () => {
      const expectedNewFolderData = new FolderData({
        id: folderId,
        name: makeEncString("Has Been Saved To API").toJSON(),
        revisionDate: new Date().toJSON(),
      });
      setUpApi(folderApiService, expectedNewFolderData);

      singleUserState.nextState({ [folderData.id]: folderData });

      const tracker = new ObservableTracker(sut.update(map((f) => f)));

      const result = await tracker.expectEmission();

      expect(result).toEqual(
        FolderView.fromJSON({
          id: folderId,
          name: "Has Been Saved To API",
          revisionDate: expectedNewFolderData.revisionDate,
        }),
      );
    });

    it("still succeeds if destroy is triggered in the middle of the update", async () => {
      setUpApi(folderApiService);
      singleUserState.nextState({ [folderData.id]: folderData });

      const tracker = new ObservableTracker(
        sut.update(
          map((f) => {
            destroy$.next();
            return f;
          }),
        ),
      );

      const result = await tracker.expectEmission();

      expect(result).toEqual(folderView);
      expect(singleUserState.nextMock).toHaveBeenLastCalledWith({ [folderData.id]: folderData });
    });
  });
});

/** Sets up folderEncryptor encrypt and decrypt operators
 *
 * Encryption will take clear text values and shove them in the `data` portion of an `EncString`
 * Decryption will take `EncString` values and assume the `data` property is the clear text value
 *
 * @param folderEncryptor The mock to set up
 */
function setUpCryptography(folderEncryptor: MockProxy<FolderEncryptor>) {
  folderEncryptor.encryptFolder.mockImplementation(() => {
    return map((f) => {
      return new Folder({
        id: f.id,
        name: makeEncString(f.name).toJSON(),
        revisionDate: f.revisionDate.toJSON(),
      });
    });
  });

  folderEncryptor.decryptFolder.mockImplementation(() => {
    return map((f) => {
      if (f == null) {
        return null;
      } else {
        return FolderView.fromJSON({
          id: f.id,
          name: new EncString(f.name).data,
          revisionDate: f.revisionDate,
        });
      }
    });
  });
}

function setUpApi(apiService: MockProxy<NewFolderApiService>, returnValue: FolderData = null) {
  apiService.updateFolderWithServer.mockImplementation(() => {
    return map((f) => {
      if (f == null) {
        return null;
      } else {
        return (
          returnValue ??
          new FolderData({
            id: f.id,
            name: f.name.toJSON(),
            revisionDate: f.revisionDate.toJSON(),
          })
        );
      }
    });
  });
}
