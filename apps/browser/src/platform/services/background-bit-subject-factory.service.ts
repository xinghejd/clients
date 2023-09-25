import { BitSubject } from "@bitwarden/common/platform/misc/bit-subject";
import { DeepJsonify } from "@bitwarden/common/types/deep-jsonify";

import { BackgroundBitSubject } from "../utils/background-bit-subject";

import { BitSubjectFactoryServiceAbstraction } from "./abstractions/bit-subject-factory.service";

export class BackgroundBitSubjectFactoryService implements BitSubjectFactoryServiceAbstraction {
  create<T>(serviceObservableName: string, initializer: (obj: DeepJsonify<T>) => T): BitSubject<T> {
    return new BackgroundBitSubject(serviceObservableName, initializer);
  }
}
