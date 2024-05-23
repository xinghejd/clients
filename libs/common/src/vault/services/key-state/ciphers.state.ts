import { Jsonify } from "type-fest";

import {
  CIPHERS_DISK,
  CIPHERS_DISK_LOCAL,
  CIPHERS_MEMORY,
  KeyDefinition,
} from "../../../platform/state";
import { CipherId } from "../../../types/guid";
import { LocalDataLatest } from "../../models/ciphers/data/latest";
import { CipherData } from "../../models/ciphers/data/version-agnostic/cipher.data";
import { CipherView } from "../../models/view/cipher.view";
import { AddEditCipherInfo } from "../../types/add-edit-cipher-info";

export const ENCRYPTED_CIPHERS = KeyDefinition.record<CipherData>(CIPHERS_DISK, "ciphers", {
  deserializer: (obj: Jsonify<CipherData>) => CipherData.fromJSON(obj),
});

export const DECRYPTED_CIPHERS = KeyDefinition.record<CipherView>(
  CIPHERS_MEMORY,
  "decryptedCiphers",
  {
    deserializer: (cipher: Jsonify<CipherView>) => CipherView.fromJSON(cipher),
  },
);

// TODO: LocalDataLatest is probably wrong here. I should probably not be versioned.
export const LOCAL_DATA_KEY = new KeyDefinition<Record<CipherId, LocalDataLatest>>(
  CIPHERS_DISK_LOCAL,
  "localData",
  {
    deserializer: (localData) => localData,
  },
);

export const ADD_EDIT_CIPHER_INFO_KEY = new KeyDefinition<AddEditCipherInfo>(
  CIPHERS_MEMORY,
  "addEditCipherInfo",
  {
    deserializer: (addEditCipherInfo: AddEditCipherInfo) => {
      if (addEditCipherInfo == null) {
        return null;
      }

      const cipher =
        addEditCipherInfo?.cipher.toJSON != null
          ? addEditCipherInfo.cipher
          : CipherView.fromJSON(addEditCipherInfo?.cipher as Jsonify<CipherView>);

      return { cipher, collectionIds: addEditCipherInfo.collectionIds };
    },
  },
);
