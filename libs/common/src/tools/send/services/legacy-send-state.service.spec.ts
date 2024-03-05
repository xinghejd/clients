import { any, mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom, skip, take } from "rxjs";

import { makeEncString, makeStaticByteArray } from "../../../../spec";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { KeyGenerationService } from "../../../platform/abstractions/key-generation.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { EncryptionType } from "../../../platform/enums/encryption-type.enum";
import { EncString } from "../../../platform/models/domain/enc-string";
import { SymmetricCryptoKey } from "../../../platform/models/domain/symmetric-crypto-key";
import { ContainerService } from "../../../platform/services/container.service";
import { CsprngArray } from "../../../types/csprng";
import { UserKey } from "../../../types/key";
import { SendType } from "../enums/send-type";
import { SendFileApi } from "../models/api/send-file.api";
import { SendTextApi } from "../models/api/send-text.api";
import { SendFileData } from "../models/data/send-file.data";
import { SendTextData } from "../models/data/send-text.data";
import { SendData } from "../models/data/send.data";
import { Send } from "../models/domain/send";
import { SendView } from "../models/view/send.view";

import { LegacySendStateService, SendStateOptions } from "./legacy-send-state.service";
import { SendStateService } from "./send-state.service.abstraction";

describe("SendStateService", () => {
  const i18nService = mock<I18nService>();
  const keyGenerationService = mock<KeyGenerationService>();
  const encryptService = mock<EncryptService>();

  let sendStateService: SendStateService;

  let stateService: MockProxy<StateService>;
  let activeAccount: BehaviorSubject<string>;
  let activeAccountUnlocked: BehaviorSubject<boolean>;

  beforeEach(() => {
    activeAccount = new BehaviorSubject("123");
    activeAccountUnlocked = new BehaviorSubject(true);

    stateService = mock<StateService>();
    stateService.activeAccount$ = activeAccount;
    stateService.activeAccountUnlocked$ = activeAccountUnlocked;

    const cryptoService = mock<CryptoService>();
    cryptoService.hasUserKey.mockResolvedValue(true);
    cryptoService.getUserKeyWithLegacySupport.mockResolvedValue(
      new SymmetricCryptoKey(makeStaticByteArray(32)) as UserKey,
    );
    const mockRandomBytes = new Uint8Array(64) as CsprngArray;
    const mockUserKey = new SymmetricCryptoKey(mockRandomBytes) as UserKey;
    cryptoService.getUserKey.mockResolvedValue(mockUserKey);

    cryptoService.rsaEncrypt.mockResolvedValue(
      new EncString(EncryptionType.Rsa2048_OaepSha1_B64, "mockEncryptedUserKey"),
    );

    (window as any).bitwardenContainerService = new ContainerService(cryptoService, encryptService);

    stateService.getEncryptedSends.calledWith(any()).mockResolvedValue({
      "1": sendData("1", "Test Send"),
    });

    stateService.getDecryptedSends
      .calledWith(any())
      .mockResolvedValue([sendView("1", "Test Send")]);

    const sendStateOptions: SendStateOptions = { cache_ms: 1 };
    sendStateOptions.cache_ms = 100;
    sendStateService = new LegacySendStateService(
      sendStateOptions,
      cryptoService,
      i18nService,
      keyGenerationService,
      stateService,
    );
  });

  afterEach(() => {
    activeAccount.complete();
    activeAccountUnlocked.complete();
  });

  describe("get$", () => {
    it("exists", async () => {
      const result = await firstValueFrom(sendStateService.get$("1"));

      expect(result).toEqual(send("1", "Test Send"));
    });

    it("does not exist", async () => {
      const result = await firstValueFrom(sendStateService.get$("2"));

      expect(result).toBe(undefined);
    });

    it("updated observable", async () => {
      const singleSendObservable = sendStateService.get$("1");
      const result = await firstValueFrom(singleSendObservable);
      expect(result).toEqual(send("1", "Test Send"));

      await sendStateService.update(sendData("1", "Test Send Updated"));

      const result2 = await firstValueFrom(singleSendObservable);
      expect(result2).toEqual(send("1", "Test Send Updated"));
    });

    it("distinctUntilChanged emits only distinct values", async () => {
      // Spy on the subscription to send "1"
      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });
      changed = false;
      await sendStateService.update(sendData("1", "Test Send 3"));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(changed).toBe(true);

      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when notes changes on a new send", async () => {
      const sendDataObject = createSendData() as SendData;

      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      sendDataObject.notes = "New notes";
      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);

      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when Text changes on a new send", async () => {
      const sendDataObject = createSendData() as SendData;

      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.text.text = "new text";
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);

      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when Text is set as null on a new send", async () => {
      const sendDataObject = createSendData() as SendData;
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.text = null;
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("Doesn't reports a change when File changes on a new send", async () => {
      const sendDataObject = createSendData({
        type: SendType.File,
        file: new SendFileData(new SendFileApi({ FileName: "name of file" })),
      }) as SendData;
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      sendDataObject.file = new SendFileData(new SendFileApi({ FileName: "updated name of file" }));
      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(false);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when key changes on a new send", async () => {
      const sendDataObject = createSendData() as SendData;

      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.key = "newKey";
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when revisionDate changes on a new send", async () => {
      const sendDataObject = createSendData() as SendData;
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.revisionDate = "2025-04-05";
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when a property is set as null on a new send", async () => {
      const sendDataObject = createSendData() as SendData;

      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.name = null;
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("does not reports a change when text's text is set as null on a new send and old send and reports a change then new send sets a text", async () => {
      const sendDataObject = createSendData({
        text: new SendTextData(new SendTextApi({ Text: null })),
      }) as SendData;

      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(false);

      sendDataObject.text.text = "Asdf";
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("do not reports a change when nothing changes on the observed send", async () => {
      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });

      const sendDataObject = sendData("1", "Test Send");

      //it is immediately called when subscribed, we need to reset the value
      changed = false;
      await sendStateService.update(sendDataObject);
      await sendStateService.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(false);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when the observed send is deleted", async () => {
      let changed = false;
      const subscription = sendStateService.get$("1").subscribe(() => {
        changed = true;
      });
      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      await sendStateService.delete("1");

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });
  });

  describe("Update", () => {
    it("Add a new send", async () => {
      const initialSends = await firstValueFrom(sendStateService.sends$);

      await sendStateService.update(sendData("2", "Test 2"));

      // Define an observable that emits once the update is processed
      const updateCompleted$ = sendStateService.sends$.pipe(
        skip(1), // Skip the initial emission (initialSends)
        take(1), // Take only one emission after initialSends
      );

      await firstValueFrom(updateCompleted$);
      const sendsAfterUpdate = await firstValueFrom(sendStateService.sends$);

      expect(sendsAfterUpdate.length).toBeGreaterThan(initialSends.length);
    });

    it("modify an existing send", async () => {
      const result = await sendStateService.update(sendData("2", "test 2"));
      expect(result).toEqual(send("2", "test 2"));
    });
  });

  describe("Delete", () => {
    it("Sends count should decrease after delete", async () => {
      const sendsBeforeDelete = await firstValueFrom(sendStateService.sends$);
      await sendStateService.delete(sendsBeforeDelete[0].id);

      // Define an observable that emits once the delete is processed
      const deleteCompleted$ = sendStateService.sends$.pipe(
        skip(1), // Skip the initial emission (initialSends)
        take(1), // Take only one emission after initialSends
      );

      await firstValueFrom(deleteCompleted$);

      const sendsAfterDelete = await firstValueFrom(sendStateService.sends$);
      expect(sendsAfterDelete.length).toBeLessThan(sendsBeforeDelete.length);
    });
  });

  // Send object helper functions

  function sendData(id: string, name: string) {
    const data = new SendData({} as any);
    data.id = id;
    data.name = "2.test|" + name + "|test";
    data.disabled = false;
    data.accessCount = 2;
    data.accessId = "1";
    data.revisionDate = null;
    data.expirationDate = null;
    data.deletionDate = null;
    data.notes = "2.test|Notes!!|test";
    data.key = null;
    return data;
  }

  const defaultSendData: Partial<SendData> = {
    id: "1",
    name: "Test Send",
    accessId: "123",
    type: SendType.Text,
    notes: "notes!",
    file: null,
    text: new SendTextData(new SendTextApi({ Text: "send text" })),
    key: "key",
    maxAccessCount: 12,
    accessCount: 2,
    revisionDate: "2024-09-04",
    expirationDate: "2024-09-04",
    deletionDate: "2024-09-04",
    password: "password",
    disabled: false,
    hideEmail: false,
  };

  function createSendData(value: Partial<SendData> = {}) {
    const testSend: any = {};
    for (const prop in defaultSendData) {
      testSend[prop] = value[prop as keyof SendData] ?? defaultSendData[prop as keyof SendData];
    }
    return testSend;
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
    data.name = makeEncString(name);
    data.disabled = false;
    data.accessCount = 2;
    data.accessId = "1";
    data.revisionDate = null;
    data.expirationDate = null;
    data.deletionDate = null;
    data.notes = makeEncString("Notes!!");
    data.key = null;
    return data;
  }
});
