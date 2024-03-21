import {
  FakeAccountService,
  FakeStateProvider,
  awaitAsync,
  mockAccountServiceWith,
} from "../../../../spec";
import { Utils } from "../../../platform/misc/utils";
import { UserId } from "../../../types/guid";
import { SendType } from "../enums/send-type";
import { SendData } from "../models/data/send.data";
import { SendView } from "../models/view/send.view";

import { SendStateProvider } from "./send-state.provider";

const sendData: Record<string, SendData> = {
  id: {
    id: "id",
    accessId: "accessId",
    type: SendType.Text,
    name: "encName",
    notes: "encNotes",
    text: {
      text: "encText",
      hidden: true,
    },
    file: null,
    key: "encKey",
    maxAccessCount: null,
    accessCount: 10,
    revisionDate: "2022-01-31T12:00:00.000Z",
    expirationDate: "2022-01-31T12:00:00.000Z",
    deletionDate: "2022-01-31T12:00:00.000Z",
    password: "password",
    disabled: false,
    hideEmail: true,
  },
};

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

describe("Send State Provider", () => {
  let stateProvider: FakeStateProvider;
  let accountService: FakeAccountService;
  let sendStateProvider: SendStateProvider;

  const mockUserId = Utils.newGuid() as UserId;

  beforeEach(() => {
    accountService = mockAccountServiceWith(mockUserId);
    stateProvider = new FakeStateProvider(accountService);

    sendStateProvider = new SendStateProvider(stateProvider);
  });

  describe("Encrypted Sends", () => {
    it("should return SendData", async () => {
      await sendStateProvider.setEncryptedSends(sendData);
      await awaitAsync();

      const actual = await sendStateProvider.getEncryptedSends();
      expect(actual).toStrictEqual(sendData);
    });
  });

  describe("Decrypted Sends", () => {
    it("should return SendView", async () => {
      const state = [sendView("1", "Test")];
      await sendStateProvider.setDecryptedSends(state);
      await awaitAsync();

      const actual = await sendStateProvider.getDecryptedSends();
      expect(actual).toStrictEqual(state);
    });
  });
});
