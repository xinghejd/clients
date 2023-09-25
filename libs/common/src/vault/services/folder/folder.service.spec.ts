// eslint-disable-next-line no-restricted-imports
import { Arg, Substitute, SubstituteOf } from "@fluffy-spoon/substitute";
import { MockProxy, mock } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom } from "rxjs";

import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { EncString } from "../../../platform/models/domain/enc-string";
import { ContainerService } from "../../../platform/services/container.service";
import { NamespacedStateService } from "../../../platform/services/state/namespaced-state-service";
import { StateServiceFactory } from "../../../platform/services/state/state-service-factory";
import { StateService } from "../../../platform/services/state.service";
import { UserId } from "../../../types/guid";
import { CipherService } from "../../abstractions/cipher.service";
import { FolderData } from "../../models/data/folder.data";
import { FolderView } from "../../models/view/folder.view";
import { FolderService } from "../../services/folder/folder.service";

describe("Folder Service", () => {
  let folderService: FolderService;

  let cryptoService: SubstituteOf<CryptoService>;
  let encryptService: SubstituteOf<EncryptService>;
  let i18nService: SubstituteOf<I18nService>;
  let cipherService: SubstituteOf<CipherService>;
  let stateService: MockProxy<StateService>;
  let stateServiceFactory: MockProxy<StateServiceFactory>;
  let namespacedStateService: MockProxy<NamespacedStateService>;
  let activeAccount: BehaviorSubject<UserId>;
  let activeAccountUnlocked: BehaviorSubject<boolean>;

  beforeEach(() => {
    cryptoService = Substitute.for();
    encryptService = Substitute.for();
    i18nService = Substitute.for();
    cipherService = Substitute.for();
    stateService = mock();
    activeAccount = new BehaviorSubject("123" as UserId);
    activeAccountUnlocked = new BehaviorSubject(true);

    stateServiceFactory = mock();
    namespacedStateService = mock();
    stateServiceFactory.buildFor.mockReturnValue(namespacedStateService);
    namespacedStateService.get.mockResolvedValue({
      "1": folderData("1", "test"),
    });
    stateService.getUserId.mockResolvedValue("123" as UserId);
    stateService.activeAccount$ = activeAccount;
    stateService.activeAccountUnlocked$ = activeAccountUnlocked;
    (window as any).bitwardenContainerService = new ContainerService(cryptoService, encryptService);

    folderService = new FolderService(
      cryptoService,
      i18nService,
      cipherService,
      stateService,
      stateServiceFactory
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("encrypt", async () => {
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
    it("exists", async () => {
      const result = await folderService.get("1");

      expect(result).toEqual({
        id: "1",
        name: {
          decryptedValue: [],
          encryptedString: "test",
          encryptionType: 0,
        },
        revisionDate: null,
      });
    });

    it("not exists", async () => {
      const result = await folderService.get("2");

      expect(result).toBe(undefined);
    });
  });

  it("upsert", async () => {
    await folderService.upsert(folderData("2", "test 2"));

    expect(await firstValueFrom(folderService.folders$)).toEqual([
      {
        id: "1",
        name: {
          decryptedValue: [],
          encryptedString: "test",
          encryptionType: 0,
        },
        revisionDate: null,
      },
      {
        id: "2",
        name: {
          decryptedValue: [],
          encryptedString: "test 2",
          encryptionType: 0,
        },
        revisionDate: null,
      },
    ]);

    expect(await firstValueFrom(folderService.folderViews$)).toEqual([
      { id: "1", name: [], revisionDate: null },
      { id: "2", name: [], revisionDate: null },
      { id: null, name: [], revisionDate: null },
    ]);
  });

  it("replace", async () => {
    await folderService.replace({ "2": folderData("2", "test 2") });

    expect(await firstValueFrom(folderService.folders$)).toEqual([
      {
        id: "2",
        name: {
          decryptedValue: [],
          encryptedString: "test 2",
          encryptionType: 0,
        },
        revisionDate: null,
      },
    ]);

    expect(await firstValueFrom(folderService.folderViews$)).toEqual([
      { id: "2", name: [], revisionDate: null },
      { id: null, name: [], revisionDate: null },
    ]);
  });

  it("delete", async () => {
    stateService.getEncryptedCiphers.mockResolvedValueOnce({});
    await folderService.delete("1");

    expect((await firstValueFrom(folderService.folders$)).length).toBe(0);

    expect(await firstValueFrom(folderService.folderViews$)).toEqual([
      { id: null, name: [], revisionDate: null },
    ]);
  });

  it("clearCache", async () => {
    await folderService.clearCache();

    expect((await firstValueFrom(folderService.folders$)).length).toBe(1);
    expect((await firstValueFrom(folderService.folderViews$)).length).toBe(0);
  });

  it("locking should clear", async () => {
    activeAccountUnlocked.next(false);
    // Sleep for 100ms to avoid timing issues
    await new Promise((r) => setTimeout(r, 100));

    expect((await firstValueFrom(folderService.folders$)).length).toBe(0);
    expect((await firstValueFrom(folderService.folderViews$)).length).toBe(0);
  });

  describe("clear", () => {
    it("null userId", async () => {
      await folderService.clear();

      expect(namespacedStateService.save).toHaveBeenCalledTimes(1);

      expect((await firstValueFrom(folderService.folders$)).length).toBe(0);
      expect((await firstValueFrom(folderService.folderViews$)).length).toBe(0);
    });

    it("matching userId", async () => {
      await folderService.clear("123" as UserId);

      expect(namespacedStateService.save).toHaveBeenCalledTimes(1);

      expect((await firstValueFrom(folderService.folders$)).length).toBe(0);
      expect((await firstValueFrom(folderService.folderViews$)).length).toBe(0);
    });

    it("missmatching userId", async () => {
      await folderService.clear("12" as UserId);

      expect(namespacedStateService.save).toHaveBeenCalledTimes(1);

      expect((await firstValueFrom(folderService.folders$)).length).toBe(1);
      expect((await firstValueFrom(folderService.folderViews$)).length).toBe(2);
    });
  });

  function folderData(id: string, name: string) {
    const data = new FolderData({} as any);
    data.id = id;
    data.name = name;

    return data;
  }
});
