import { BitSubject } from "@bitwarden/common/platform/misc/bit-subject";
import { DeepJsonify } from "@bitwarden/common/types/deep-jsonify";

export abstract class BitSubjectFactoryServiceAbstraction {
  create: <T>(
    serviceObservableName: string,
    initializer: (obj: DeepJsonify<T>) => T
  ) => BitSubject<T>;
}
