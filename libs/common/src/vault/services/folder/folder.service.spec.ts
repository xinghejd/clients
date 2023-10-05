// eslint-disable-next-line no-restricted-imports
import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";
import { mock } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom } from "rxjs";

import { TestUserState } from "../../../../spec/test-user-state";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { UserStateProvider } from "../../../platform/abstractions/user-state.provider";
import { EncString } from "../../../platform/models/domain/enc-string";
import { ContainerService } from "../../../platform/services/container.service";
import { DerivedUserState } from "../../../platform/services/default-user-state.provider";
import { StateService } from "../../../platform/services/state.service";
import { CipherService } from "../../abstractions/cipher.service";
import { FolderData } from "../../models/data/folder.data";
import { Folder } from "../../models/domain/folder";
import { FolderView } from "../../models/view/folder.view";
import { FolderService } from "../../services/folder/folder.service";

describe("Folder Service", () => {
  let folderService: FolderService;

  let cryptoService: SubstituteOf<CryptoService>;
  let encryptService: SubstituteOf<EncryptService>;
  let i18nService: SubstituteOf<I18nService>;
  let cipherService: SubstituteOf<CipherService>;
  let stateService: SubstituteOf<StateService>;
  let activeAccount: BehaviorSubject<string>;
  let activeAccountUnlocked: BehaviorSubject<boolean>;
  const userStateProvider = mock<UserStateProvider>();
  let userState: TestUserState<Record<string, FolderData>>;
  const derivedUserState = mock<DerivedUserState<Record<string, FolderData>, FolderView[]>>();
  let folderViews$: BehaviorSubject<FolderView[]>;

  beforeEach(() => {
    cryptoService = Substitute.for();
    encryptService = Substitute.for();
    i18nService = Substitute.for();
    cipherService = Substitute.for();
    stateService = Substitute.for();
    activeAccount = new BehaviorSubject("123");
    activeAccountUnlocked = new BehaviorSubject(true);

    const initialState = {
      "1": folderData("1", "test"),
    };
    stateService.getEncryptedFolders().resolves(initialState);
    stateService.activeAccount$.returns(activeAccount);
    stateService.activeAccountUnlocked$.returns(activeAccountUnlocked);
    (window as any).bitwardenContainerService = new ContainerService(cryptoService, encryptService);

    userState = new TestUserState({});
    userState.next(initialState);
    userStateProvider.create.mockReturnValue(userState);
    userState.createDerived.mockReturnValue(derivedUserState);

    folderViews$ = new BehaviorSubject([]);
    derivedUserState.state$ = folderViews$;

    folderService = new FolderService(
      cryptoService,
      i18nService,
      cipherService,
      userStateProvider,
      stateService
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    folderViews$.complete();
    userState.complete();
  });

  test("encrypt", async () => {
    const model = new FolderView();
    model.id = "2";
    model.name = "Test Folder";

    cryptoService.encrypt(Arg.any()).resolves(new EncString("ENC"));
    cryptoService.decryptToUtf8(Arg.any()).resolves("DEC");

    const result = await folderService.encrypt(model);

    expect(result).toEqual({
      id: "2",
      name: {
        encryptedString: "ENC",
        encryptionType: 0,
      },
    });
  });

  describe("get", () => {
    it("returns the current state", async () => {
      const result = await folderService.get("1");

      expect(result).toEqual(folder("1", "test"));
    });

    it("returns a Folder object", async () => {
      const result = await folderService.get("1");

      expect(result).toBeInstanceOf(Folder);
    });

    it("returns null if not found", async () => {
      const result = await folderService.get("2");

      expect(result).toBe(null);
    });
  });

  test("upsert emits new folder$ array", async () => {
    await folderService.upsert(folderData("2", "test 2"));

    expect(await firstValueFrom(folderService.folders$)).toEqual([
      folder("1", "test"),
      folder("2", "test 2"),
    ]);
  });
  test("replace", async () => {
    await folderService.replace({ "2": folderData("2", "test 2") });

    expect(await firstValueFrom(folderService.folders$)).toEqual([folder("2", "test 2")]);
  });

  test("delete", async () => {
    await folderService.delete("1");

    expect((await firstValueFrom(folderService.folders$)).length).toBe(0);
  });

  test("clear nulls folders", async () => {
    await folderService.clear();

    expect(await firstValueFrom(folderService.folders$)).toEqual(expect.arrayContaining([]));
  });

  describe("clear", () => {
    it("null userId", async () => {
      await folderService.clear();

      expect(userState.update).toHaveBeenCalled();
      expect(await firstValueFrom(folderService.folders$)).toEqual(expect.arrayContaining([]));
    });

    it("active userId", async () => {
      await folderService.clear("1");

      expect(userState.updateFor).toHaveBeenCalled();
      const updateCallback = userState.updateFor.mock.calls[0][1];
      expect(updateCallback({ "2": folderData("2", "test") })).toEqual(expect.objectContaining({}));
    });

    it("inactive userId", async () => {
      await folderService.clear("12");

      expect(userState.updateFor).toHaveBeenCalled();
      const updateCallback = userState.updateFor.mock.calls[0][1];
      expect(updateCallback({ "2": folderData("2", "test") })).toEqual(expect.objectContaining({}));
    });
  });

  function folderData(id: string, name: string) {
    return Object.assign(new FolderData({} as any), {
      id,
      name,
      revisionDate: null,
    });
  }

  function folder(id: string, name: string) {
    return Object.assign(new Folder({} as any), {
      id,
      name: new EncString(name),
      revisionDate: null,
    });
  }
});
