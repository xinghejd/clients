import { BitSubject } from "@bitwarden/common/platform/misc/bit-subject";
import { DeepJsonify } from "@bitwarden/common/types/deep-jsonify";

import { ForegroundBitSubject } from "../utils/foreground-bit-subject";

import { BitSubjectFactoryServiceAbstraction } from "./abstractions/bit-subject-factory.service";

export class ForegroundBitSubjectFactoryService implements BitSubjectFactoryServiceAbstraction {
  create<T>(serviceObservableName: string, initializer: (obj: DeepJsonify<T>) => T): BitSubject<T> {
    return new ForegroundBitSubject(serviceObservableName, initializer);
  }
}
