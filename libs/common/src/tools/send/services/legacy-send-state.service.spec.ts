import { any, mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom, skip, take } from "rxjs";

import { makeStaticByteArray } from "../../../../spec";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { EncryptionType } from "../../../platform/enums/encryption-type.enum";
import { Utils } from "../../../platform/misc/utils";
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

import { SendStateOptions } from "./asymmetrical-send-state.abstraction";
import { LegacySendStateService } from "./legacy-send-state.service";

describe("asymmetricalSendState", () => {
  const i18nService = mock<I18nService>();
  const encryptService = mock<EncryptService>();
  const cryptoService = mock<CryptoService>();
  const sendStateOptions: SendStateOptions = { cache_ms: 1 };

  let asymmetricalSendState: LegacySendStateService;

  let stateService: MockProxy<StateService>;
  let activeAccount: BehaviorSubject<string>;
  let activeAccountUnlocked: BehaviorSubject<boolean>;

  beforeEach(() => {
    activeAccount = new BehaviorSubject("123");
    activeAccountUnlocked = new BehaviorSubject(true);

    stateService = mock<StateService>();
    stateService.activeAccount$ = activeAccount;
    stateService.activeAccountUnlocked$ = activeAccountUnlocked;

    cryptoService.hasUserKey.mockResolvedValue(true);
    cryptoService.getUserKeyWithLegacySupport.mockResolvedValue(
      new SymmetricCryptoKey(makeStaticByteArray(32)) as UserKey,
    );

    const mockRandomBytes = new Uint8Array(64) as CsprngArray;
    cryptoService.decryptToBytes.mockResolvedValue(mockRandomBytes);
    const symmetricCryptoKey = new SymmetricCryptoKey(
      Utils.fromUtf8ToArray("00000000000000000000000000000000"),
    );
    cryptoService.makeSendKey.mockResolvedValue(symmetricCryptoKey);

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

    sendStateOptions.cache_ms = 100;
    asymmetricalSendState = new LegacySendStateService(
      sendStateOptions,
      cryptoService,
      i18nService,
      stateService,
    );
  });

  afterEach(() => {
    activeAccount.complete();
    activeAccountUnlocked.complete();
  });

  describe("get$", () => {
    const decryptSend = jest.spyOn(LegacySendStateService.prototype as any, "decryptSend");

    decryptSend.mockImplementation((send) => {
      const sendView = new SendView(send as Send);
      sendView.name = (send as Send).name?.data ?? (send as Send).name?.encryptedString ?? "";
      sendView.notes = (send as Send).notes?.data ?? (send as Send).notes?.encryptedString ?? "";

      return new Promise(function (resolve, reject) {
        resolve(sendView);
      });
    });

    it("exists", async () => {
      const result = await firstValueFrom(asymmetricalSendState.get$("1"));

      expect(result).toEqual(sendView("1", "Test Send"));
    });

    it("does not exist", async () => {
      const result = await firstValueFrom(asymmetricalSendState.get$("2"));

      expect(result).toBe(undefined);
    });

    it("updated observable", async () => {
      const singleSendObservable = asymmetricalSendState.get$("1");
      const result = await firstValueFrom(singleSendObservable);
      expect(result).toEqual(sendView("1", "Test Send"));

      await asymmetricalSendState.update(sendData("1", "Test Send Updated"));

      const result2 = await firstValueFrom(singleSendObservable);
      expect(result2).toEqual(sendView("1", "Test Send Updated"));
    });

    it("distinctUntilChanged emits only distinct values", async () => {
      // Spy on the subscription to send "1"
      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });
      changed = false;
      await asymmetricalSendState.update(sendData("1", "Test Send 3"));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(changed).toBe(true);

      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when notes changes on a new send", async () => {
      const sendDataObject = createSendData() as SendData;

      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      sendDataObject.notes = "New notes";
      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);

      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when Text changes on a new send", async () => {
      const sendDataObject = createSendData() as SendData;

      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.text.text = "new text";
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);

      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when Text is set as null on a new send", async () => {
      const sendDataObject = createSendData() as SendData;
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.text = null;
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("Doesn't reports a change when File changes on a new send", async () => {
      const sendDataObject = createSendData({
        type: SendType.File,
        file: new SendFileData(new SendFileApi({ FileName: "name of file" })),
      }) as SendData;
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      //sendDataObject.file = new SendFileData(new SendFileApi({ FileName: "updated name of file" }));
      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendDataObject);

      expect(changed).toEqual(false);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when key changes on a new send", async () => {
      const sendDataObject = createSendData() as SendData;

      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.key = "newKey";
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when revisionDate changes on a new send", async () => {
      const sendDataObject = createSendData() as SendData;
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.revisionDate = "2025-04-05";
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when a property is set as null on a new send", async () => {
      const sendDataObject = createSendData() as SendData;

      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      sendDataObject.name = null;
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("does not reports a change when text's text is set as null on a new send and old send and reports a change then new send sets a text", async () => {
      const sendDataObject = createSendData({
        id: "1",
        name: "2.test|Send name|test",
        notes: "2.test|Send Notes|test",
        text: new SendTextData(new SendTextApi({ Text: null })),
      }) as SendData;

      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      await new Promise((resolve) => setTimeout(resolve, 200));
      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(false);

      await new Promise((resolve) => setTimeout(resolve, 200));
      sendDataObject.text.text = "Asdf";
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("do not reports a change when nothing changes on the observed send", async () => {
      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });

      const sendDataObject = sendData("1", "Test Send");
      await new Promise((resolve) => setTimeout(resolve, 100));

      //it is immediately called when subscribed, we need to reset the value
      changed = false;
      await asymmetricalSendState.update(sendDataObject);
      await asymmetricalSendState.update(sendData("2", "Test Send 2"));

      expect(changed).toEqual(false);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });

    it("reports a change when the observed send is deleted", async () => {
      let changed = false;
      const subscription = asymmetricalSendState.get$("1").subscribe(() => {
        changed = true;
      });
      //it is immediately called when subscribed, we need to reset the value
      changed = false;

      await asymmetricalSendState.delete("1");

      expect(changed).toEqual(true);
      // Unsubscribe to prevent memory leaks
      subscription.unsubscribe();
    });
  });

  describe("Update", () => {
    it("Add a new send", async () => {
      const initialSends = await firstValueFrom(asymmetricalSendState.sendViews$);

      await asymmetricalSendState.update(sendData("2", "Test 2"));

      // Define an observable that emits once the update is processed
      const updateCompleted$ = asymmetricalSendState.sendViews$.pipe(
        skip(1), // Skip the initial emission (initialSends)
        take(1), // Take only one emission after initialSends
      );

      await firstValueFrom(updateCompleted$);
      const sendsAfterUpdate = await firstValueFrom(asymmetricalSendState.sendViews$);

      expect(sendsAfterUpdate.length).toBeGreaterThan(initialSends.length);
    });

    it("modify an existing send", async () => {
      await asymmetricalSendState.update(sendData("2", "test 2"));
      const result = await firstValueFrom(asymmetricalSendState.get$("2"));
      expect(result).toEqual(sendView("2", "test 2"));
    });

    it("Update multiple sends", async () => {
      await asymmetricalSendState.update([
        sendData("2", "test 2"),
        sendData("1", "updated send 1"),
      ]);
      const resultSend1 = await firstValueFrom(asymmetricalSendState.get$("1"));
      const resultSend2 = await firstValueFrom(asymmetricalSendState.get$("2"));
      expect(resultSend1).toEqual(sendView("1", "updated send 1"));
      expect(resultSend2).toEqual(sendView("2", "test 2"));
    });
  });

  describe("Delete", () => {
    it("Sends count should decrease after delete", async () => {
      const sendsBeforeDelete = await firstValueFrom(asymmetricalSendState.sendViews$);
      await asymmetricalSendState.delete(sendsBeforeDelete[0].id);

      // Define an observable that emits once the delete is processed
      const deleteCompleted$ = asymmetricalSendState.sendViews$.pipe(
        skip(1), // Skip the initial emission (initialSends)
        take(1), // Take only one emission after initialSends
      );

      await firstValueFrom(deleteCompleted$);

      const sendsAfterDelete = await firstValueFrom(asymmetricalSendState.sendViews$);
      expect(sendsAfterDelete.length).toBeLessThan(sendsBeforeDelete.length);
    });

    it("Intended send should be delete", async () => {
      const sendsBeforeDelete = await firstValueFrom(asymmetricalSendState.sendViews$);
      await asymmetricalSendState.delete(sendsBeforeDelete[0].id);

      // Define an observable that emits once the delete is processed
      const deleteCompleted$ = asymmetricalSendState.sendViews$.pipe(
        skip(1), // Skip the initial emission (initialSends)
        take(1), // Take only one emission after initialSends
      );

      await firstValueFrom(deleteCompleted$);

      const sendsAfterDelete = await firstValueFrom(asymmetricalSendState.sendViews$);
      expect(sendsAfterDelete[0]).not.toBe(sendsBeforeDelete[0]);
    });

    it("Deleting on an empty sends array should not throw", async () => {
      stateService.getEncryptedSends.calledWith(any()).mockResolvedValue(null);
      await expect(asymmetricalSendState.delete("2")).resolves.not.toThrow();
    });

    it("Delete multiple sends", async () => {
      await asymmetricalSendState.update(sendData("2", "test 2"));
      await asymmetricalSendState.delete(["1", "2"]);
      const sendsAfterDelete = await firstValueFrom(asymmetricalSendState.sendViews$);
      expect(sendsAfterDelete.length).toBe(0);
    });
  });

  describe("Replace", () => {
    it("Should swap the sends", async () => {
      const newSends: { [id: string]: SendData } = {};
      const sendData1 = new SendData();
      sendData1.id = "0";
      sendData1.name = "Send at zero";

      const sendData2 = new SendData();
      sendData2.id = "1";
      sendData2.name = "Send at one";
      newSends[0] = sendData1;
      newSends[1] = sendData2;
      await asymmetricalSendState.replace(newSends);

      const sends = await firstValueFrom(asymmetricalSendState.sendViews$);
      expect(sends.length).toBe(2);
    });

    it("Ids should correctly match", async () => {
      const newSends: { [id: string]: SendData } = {};
      const sendData1 = new SendData();
      sendData1.id = "3";
      sendData1.name = "Send at zero";

      const sendData2 = new SendData();
      sendData2.id = "4";
      sendData2.name = "Send at one";
      newSends[3] = sendData1;
      newSends[4] = sendData2;
      await asymmetricalSendState.replace(newSends);

      const sends = await firstValueFrom(asymmetricalSendState.sendViews$);
      expect(sends[0].id).toBe(sendData1.id);
      expect(sends[1].id).toBe(sendData2.id);
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
    return data;
  }
});
