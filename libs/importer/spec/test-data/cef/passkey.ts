import { CredentialExchangeFormat } from "../../../src/importers/cef/types/cef-importer-types";

const passkey: CredentialExchangeFormat = {
  version: 1,
  exporter: "Nordpass",
  timestamp: 1711017120,
  accounts: [
    {
      id: "181,38,97,101,157,46,184,237",
      userName: "john_doe",
      email: "johndoe@test.com",
      fullName: "John Doe",
      icon: "",
      collections: [],
      items: [
        {
          id: "141,125,108,181,161,77,221,67",
          creationAt: 1710755527,
          modifiedAt: 1710755527,
          type: "login",
          title: "passkeys.io",
          credentials: [
            {
              type: "passkey",
              credentialId: "5,118,198,186,199,43,147,228",
              rpId: "www.passkeys.io",
              userName: "wrong@email.com",
              userDisplayName: "",
              userHandle: "",
              key: {
                CoseKey:
                  "pgECAyYgASFYIP6iIen16POjtGroSJ+Qh9OmBUezMG2DAx3pLTa3bIOpIlggjxS3dNeWIy3sfFH8Yu2M/AOv5jy5oP3UiuSSfPaqTH0jWCBHxRWAKLl48xmjMo0AJK2S4mPIxHW6KsKFd2vwiFX40A==",
              },
            },
          ],
        },
      ],
      // "extensions": [],
    },
  ],
};
export const passkeyString = JSON.stringify(passkey);
