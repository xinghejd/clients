/** Request key parameters for sshkey credential generation.
 *  Length may only be specified for rsa keys.
 */
export type SshKeyGenerationOptions = {
  /** The length of the (rsa) key selected by the user in bits. */
  length?: number;

  /** The key type selected by the user. */
  type?: "rsa" | "ed25519";
};
