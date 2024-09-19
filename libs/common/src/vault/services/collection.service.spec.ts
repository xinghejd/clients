import { mock, MockProxy } from "jest-mock-extended";
import { firstValueFrom, of, skip } from "rxjs";

import {
  FakeStateProvider,
  makeEncString,
  makeSymmetricCryptoKey,
  mockAccountServiceWith,
} from "../../../spec";
import { CryptoService } from "../../platform/abstractions/crypto.service";
import { EncryptService } from "../../platform/abstractions/encrypt.service";
import { I18nService } from "../../platform/abstractions/i18n.service";
import { Utils } from "../../platform/misc/utils";
import { EncString } from "../../platform/models/domain/enc-string";
import { ContainerService } from "../../platform/services/container.service";
import { CollectionId, OrganizationId, UserId } from "../../types/guid";
import { OrgKey } from "../../types/key";
import { CollectionData } from "../models/data/collection.data";

import { CollectionService, ENCRYPTED_COLLECTION_DATA_KEY } from "./collection.service";


describe("CollectionService", () => {
  afterEach(() => {
    delete (window as any).bitwardenContainerService;
  });

  describe("decryptedCollections$", () => {
    it("emits decrypted collections from state", async () => {
      // Arrange test collections
      const org1 = Utils.newGuid() as OrganizationId;
      const org2 = Utils.newGuid() as OrganizationId;

      const collection1 = collectionDataFactory(org1);
      const collection2 = collectionDataFactory(org2);

      // Arrange state provider
      const userId = Utils.newGuid() as UserId;
      const fakeStateProvider = new FakeStateProvider(mockAccountServiceWith(userId));

      await fakeStateProvider.setUserState(ENCRYPTED_COLLECTION_DATA_KEY, {
        [collection1.id]: collection1,
        [collection2.id]: collection2,
      });

      // Arrange cryptoService - orgKeys and mock decryption
      const cryptoService = mock<CryptoService>();
      cryptoService.orgKeys$.mockReturnValue(
        of({
          [org1]: makeSymmetricCryptoKey<OrgKey>(),
          [org2]: makeSymmetricCryptoKey<OrgKey>(),
        }),
      );
      mockEncStringDecryption(cryptoService);

      const i18nService = mock<I18nService>();
      i18nService.collator = null; // this is a mock only, avoid use of this object

      const collectionService = new CollectionService(
        cryptoService,
        i18nService,
        fakeStateProvider,
      );

      const result = await firstValueFrom(collectionService.decryptedCollections$.pipe(skip(1)));
      expect(result.length).toBe(2);
      expect(result[0]).toMatchObject({
        id: collection1.id,
        name: "DECRYPTED_STRING",
      });
      expect(result[1]).toMatchObject({
        id: collection2.id,
        name: "DECRYPTED_STRING",
      });
    });
  });
});

const mockEncStringDecryption = (cryptoService: MockProxy<CryptoService>) => {
  const encryptService = mock<EncryptService>();
  encryptService.decryptToUtf8
    .calledWith(expect.any(EncString), expect.anything())
    .mockResolvedValue("DECRYPTED_STRING");

  (window as any).bitwardenContainerService = new ContainerService(cryptoService, encryptService);
};

const collectionDataFactory = (orgId: OrganizationId) => {
  const collection = new CollectionData({} as any);
  collection.id = Utils.newGuid() as CollectionId;
  collection.organizationId = orgId;
  collection.name = makeEncString("ENC_STRING").encryptedString;

  return collection;
};
