import { mock } from "jest-mock-extended";
import { BehaviorSubject, of } from "rxjs";

import {
  FakeAccountService,
  FakeActiveUserState,
  FakeStateProvider,
  mockAccountServiceWith,
} from "../../../../spec";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { KeyGenerationService } from "../../../platform/abstractions/key-generation.service";
import { Utils } from "../../../platform/misc/utils";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { ContainerService } from "../../../platform/services/container.service";
import { UserId } from "../../../types/guid";
import { UserKey } from "../../../types/key";
import { SendData } from "../models/data/send.data";
import { Send } from "../models/domain/send";
import { SendView } from "../models/view/send.view";

import { SEND_USER_DECRYPTED, SEND_USER_ENCRYPTED } from "./key-definitions";
import { SendStateProvider } from "./send-state.provider";
import { SendStateService as SendStateServiceAbstraction } from "./send-state.service.abstraction";
import { SendService } from "./send.service";

describe("SendService", () => {
  const cryptoService = mock<CryptoService>();
  const i18nService = mock<I18nService>();
  const keyGenerationService = mock<KeyGenerationService>();
  const encryptService = mock<EncryptService>();
  const sendStateService = mock<SendStateServiceAbstraction>();

  let sendStateProvider: SendStateProvider;
  let sendService: SendService;

  let stateProvider: FakeStateProvider;
  let encryptedState: FakeActiveUserState<Record<string, SendData>>;
  let decryptedState: FakeActiveUserState<SendView[]>;

  const mockUserId = Utils.newGuid() as UserId;
  let accountService: FakeAccountService;

  beforeEach(() => {
    accountService = mockAccountServiceWith(mockUserId);
    stateProvider = new FakeStateProvider(accountService);
    sendStateProvider = new SendStateProvider(stateProvider);

    (window as any).bitwardenContainerService = new ContainerService(cryptoService, encryptService);

    sendService = new SendService(
      cryptoService,
      i18nService,
      keyGenerationService,
      sendStateProvider,
      sendStateService,
    );

    // Initial encrypted state
    encryptedState = stateProvider.activeUser.getFake(SEND_USER_ENCRYPTED);
    encryptedState.nextState({
      "1": sendData("1", "Test Send"),
    });

    const mockSend = send("1", "Send 1");
    const sends = new BehaviorSubject<Send[]>([mockSend]);
    sendStateService.sends$ = sends;

    sendService = new SendService(
      cryptoService,
      i18nService,
      keyGenerationService,
      sendStateProvider,
      sendStateService,
    );
  });

  afterEach(() => {
    // Initial decrypted state
    decryptedState = stateProvider.activeUser.getFake(SEND_USER_DECRYPTED);
    decryptedState.nextState([sendView("1", "Test Send")]);
  });

  it("get$", async () => {
    await sendService.get$("1");

    sendStateService.get$.mockImplementationOnce(() => null);

    expect(sendStateService.get$).toHaveBeenCalledTimes(1);
  });

  it("getAll", async () => {
    const sends = await sendService.getAll();
    const send1 = sends[0];

    expect(sends).toHaveLength(1);
    expect(send1).toEqual(send("1", "Test Send"));
  });

  it("getAllDecryptedFromState", async () => {
    cryptoService.hasUserKey.mockImplementationOnce(async () => true);
    sendStateProvider.getDecryptedSends = jest.fn();
    await sendService.getAllDecryptedFromState();

    expect(sendStateProvider.getDecryptedSends).toHaveBeenCalledTimes(1);
  });

  describe("getRotatedKeys", () => {
    let encryptedKey: EncString;
    beforeEach(() => {
      cryptoService.decryptToBytes.mockResolvedValue(new Uint8Array(32));
      encryptedKey = new EncString("Re-encrypted Send Key");
      cryptoService.encrypt.mockResolvedValue(encryptedKey);
    });

    it("returns re-encrypted user sends", async () => {
      const newUserKey = new SymmetricCryptoKey(new Uint8Array(32)) as UserKey;
      const mockSend = send("1", "Send 1");
      mockSend.key = encryptedKey;
      const sends = new BehaviorSubject<Send[]>([mockSend]);
      sendStateService.sends$ = sends;

      const result = await sendService.getRotatedKeys(newUserKey);

      expect(result).toMatchObject([{ id: "1", key: "Re-encrypted Send Key" }]);
    });

    it("returns null if there are no sends", async () => {
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      sendService.replace(null);
      sendStateService.sends$ = of([]);

      const newUserKey = new SymmetricCryptoKey(new Uint8Array(32)) as UserKey;
      const result = await sendService.getRotatedKeys(newUserKey);

      expect(result).toEqual([]);
    });

    it("throws if the new user key is null", async () => {
      await expect(sendService.getRotatedKeys(null)).rejects.toThrowError(
        "New user key is required for rotation.",
      );
    });
  });

  describe("getFromState", () => {
    it("exists", async () => {
      const result = await sendService.getFromState("1");

      expect(result).toEqual(send("1", "Test Send"));
    });
    it("does not exist", async () => {
      const result = await sendService.getFromState("2");

      expect(result).toBe(null);
    });
  });

  // InternalSendService

  describe("InternalSendService", () => {
    it("upsert", async () => {
      await sendService.upsert(sendData("2", "Test 2"));
      sendStateService.upsert.mockImplementationOnce(() => null);

      expect(sendStateService.upsert).toHaveBeenCalledTimes(1);
    });

    it("replace", async () => {
      await sendService.upsert(sendData("2", "Test 2"));
      sendStateService.replace.mockImplementationOnce(() => null);

      expect(sendStateService.replace).toHaveBeenCalledTimes(1);
    });

    it("delete", async () => {
      await sendService.delete("1");
      sendStateService.delete.mockImplementationOnce(() => null);

      expect(sendStateService.delete).toHaveBeenCalledTimes(1);
    });
  });

  // Send object helper functions

  function sendData(id: string, name: string) {
    const data = new SendData({} as any);
    data.id = id;
    data.name = name;
    data.disabled = false;
    data.accessCount = 2;
    data.accessId = "1";
    data.revisionDate = null;
    data.expirationDate = null;
    data.deletionDate = null;
    data.notes = "Notes!!";
    data.key = null;
    return data;
  }

  function sendView(id: string, name: string) {
    const data = new SendView({} as any);
    data.id = id;
    data.name = name;
    data.disabled = false;
    data.accessCount = 2;
    data.accessId = "1";
    data.revisionDate = null;
    data.expirationDate = null;
    data.deletionDate = null;
    data.notes = "Notes!!";
    data.key = null;
    return data;
  }

  function send(id: string, name: string) {
    const data = new Send({} as any);
    data.id = id;
    data.name = new EncString(name);
    data.disabled = false;
    data.accessCount = 2;
    data.accessId = "1";
    data.revisionDate = null;
    data.expirationDate = null;
    data.deletionDate = null;
    data.notes = new EncString("Notes!!");
    data.key = null;
    return data;
  }
});
