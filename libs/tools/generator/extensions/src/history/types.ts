import { Jsonify } from "type-fest";

/** Kinds of credentials that can be stored by the history service */
export type GeneratorCategory = "password" | "passphrase";

/** Configuration options for the history service */
export type HistoryServiceOptions = {
  /** Total number of records retained across all types.
   *  @remarks Setting this to 0 or less disables history completely.
   * */
  maxTotal: number;
};

/** A credential generation result */
export class GeneratedCredential {
  /**
   * Instantiates a generated credential
   * @param credential The value of the generated credential (e.g. a password)
   * @param category The kind of credential
   * @param generationDate The date that the credential was generated.
   *   Numeric values should are interpreted using {@link Date.valueOf}
   *   semantics.
   */
  constructor(
    readonly credential: string,
    readonly category: GeneratorCategory,
    generationDate: Date | number,
  ) {
    if (typeof generationDate === "number") {
      this.generationDate = new Date(generationDate);
    } else {
      this.generationDate = generationDate;
    }
  }

  /** The date that the credential was generated */
  generationDate: Date;

  /** Constructs a credential from its `toJSON` representation */
  static fromJSON(jsonValue: Jsonify<GeneratedCredential>) {
    return new GeneratedCredential(
      jsonValue.credential,
      jsonValue.category,
      jsonValue.generationDate,
    );
  }

  /** Serializes a credential to a JSON-compatible object */
  toJSON() {
    return {
      credential: this.credential,
      category: this.category,
      generationDate: this.generationDate.valueOf(),
    };
  }
}
