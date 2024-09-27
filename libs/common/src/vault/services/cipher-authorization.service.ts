import { map, Observable, of } from "rxjs";

import { CollectionId } from "@bitwarden/common/types/guid";

import { CollectionService } from "../abstractions/collection.service";
import { CipherView } from "../models/view/cipher.view";

export abstract class CipherAuthorizationServiceAbstraction {
  canDeleteCipher$: (cipher: CipherView, activeCollectionId?: CollectionId) => Observable<boolean>;
}

export class CipherAuthorizationService implements CipherAuthorizationServiceAbstraction {
  constructor(private collectionService: CollectionService) {}

  canDeleteCipher$(cipher: CipherView, activeCollectionId?: CollectionId): Observable<boolean> {
    if (cipher.organizationId == null) {
      return of(true);
    }

    return this.collectionService
      .decryptedCollectionViews$(cipher.collectionIds as CollectionId[])
      .pipe(
        map((allCollections) => {
          if (activeCollectionId) {
            const activeCollection = allCollections.find((c) => c.id === activeCollectionId);
            if (activeCollection) {
              return activeCollection.manage === true;
            }
          }

          return allCollections
            .filter((c) => cipher.collectionIds.includes(c.id))
            .some((collection) => collection.manage);
        }),
      );
  }
}
