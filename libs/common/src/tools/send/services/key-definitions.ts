import { KeyDefinition, SEND_MEMORY } from "../../../platform/state";
import { SendData } from "../models/data/send.data";
import { SendView } from "../models/view/send.view";

export const SEND_USER_ENCRYPTED = KeyDefinition.record<SendData>(
  SEND_MEMORY,
  "sendUserEncrypted",
  {
    deserializer: (obj: SendData) => obj,
  },
);

export const SEND_USER_DECRYPTED = new KeyDefinition<SendView[]>(SEND_MEMORY, "sendUserDecrypted", {
  deserializer: (obj) => obj,
});
