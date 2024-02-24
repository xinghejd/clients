import { SendView } from "../tools/send/models/view/send.view";
import { CipherView } from "../vault/models/view/cipher.view";

export abstract class SearchService {
  indexedEntityId?: string = null;
  abstract clearIndex(): void;
  abstract isSearchable(query: string): boolean;
  abstract indexCiphers(ciphersToIndex: CipherView[], indexedEntityGuid?: string): void;
  abstract searchCiphers(
    query: string,
    filter?: ((cipher: CipherView) => boolean) | ((cipher: CipherView) => boolean)[],
    ciphers?: CipherView[],
  ): Promise<CipherView[]>;
  abstract searchCiphersBasic(
    ciphers: CipherView[],
    query: string,
    deleted?: boolean,
  ): CipherView[];
  abstract searchSends(sends: SendView[], query: string): SendView[];
}
