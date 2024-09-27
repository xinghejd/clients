import { SshKeyApi } from "@bitwarden/common/vault/models/api/ssh-key.api";
import { SshKeyNativeGeneratorAbstraction } from "../../../../../libs/tools/generator/core/src/abstractions/sshkey-native-generator.abstraction";
import { SshKeyData } from "@bitwarden/common/vault/models/data/ssh-key.data";

export class ElectronSshKeyGeneratorService implements SshKeyNativeGeneratorAbstraction {
  async generate(keyAlgorithm: "rsa" | "ed25519", keyLength?: number): Promise<SshKeyData> {
    let algorithmNameWithBits = keyAlgorithm;
    if (keyAlgorithm === "rsa") {
      algorithmNameWithBits += `${keyLength}`;
    }
    console.log("generating", algorithmNameWithBits);
    const key = await ipc.platform.sshAgent.generateKey(keyAlgorithm);
    console.log("key", key);
    return new SshKeyData(
      new SshKeyApi({
        privateKey: key.privateKey,
        publicKey: key.publicKey,
        keyFingerprint: key.keyFingerprint,
      }),
    );
  }
}
