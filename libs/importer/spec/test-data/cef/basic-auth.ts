import { CredentialExchangeFormat } from "../../../src/importers/cef/types/cef-importer-types";

const basicAuth: CredentialExchangeFormat = {
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
          id: "213,80,125,188,192,94,59,85",
          creationAt: 1709279117,
          modifiedAt: 1709279117,
          type: "login",
          title: "Login full",
          credentials: [
            {
              type: "basic-auth",
              urls: ["https://website.com"],
              username: {
                id: "230,186,128,165,122,226,85,62",
                fieldType: "text",
                value: "Email or username",
                label: "Username",
              },
              password: {
                id: "129,94,46,96,192,246,89,57",
                fieldType: "password",
                value: "password",
                label: "Password",
              },
            },
          ],
        },
      ],
      // "extensions": [],
    },
  ],
};
export const basicAuthString = JSON.stringify(basicAuth);
