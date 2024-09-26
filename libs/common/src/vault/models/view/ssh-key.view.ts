import { Jsonify } from "type-fest";

import { SSHKey } from "../domain/ssh-key";

import { ItemView } from "./item.view";

export class SSHKeyView extends ItemView {
  privateKey: string = null;
  publicKey: string = null;
  keyFingerprint: string = null;

  constructor(n?: SSHKey) {
    super();
    if (!n) {
      return;
    }
  }

  get maskedPrivateKey(): string {
    let lines = this.privateKey.split("\n").filter((l) => l.trim() !== "");
    lines = lines.map((l, i) => {
      if (i === 0 || i === lines.length - 1) {
        return l;
      }
      return this.maskLine(l);
    });
    return lines.join("\n");
  }

  private maskLine(line: string): string {
    return "•".repeat(32);
  }

  get subTitle(): string {
    return this.keyFingerprint;
  }

  static fromJSON(obj: Partial<Jsonify<SSHKeyView>>): SSHKeyView {
    return Object.assign(new SSHKeyView(), obj);
  }
}
