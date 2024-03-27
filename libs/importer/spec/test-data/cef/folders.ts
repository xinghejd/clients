import { CredentialExchangeFormat } from "../../../src/importers/cef/types/cef-importer-types";

const folders: CredentialExchangeFormat = {
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
      collections: [
        {
          id: "112,196,235,107,56,184,65,239",
          title: "2Passwords",
          items: [
            {
              id: "222,179,189,207,131,82,171,80",
              creationAt: 1709279117,
              modifiedAt: 1709279117,
              type: "login",
              title: "Login minimal",
              credentials: [
                {
                  type: "basic-auth",
                  urls: [],
                  username: {
                    id: "163,113,167,124,110,179,220,244",
                    fieldType: "text",
                    value: "",
                    label: "Username",
                  },
                  password: {
                    id: "188,103,178,102,195,129,80,160",
                    fieldType: "password",
                    value: "",
                    label: "Password",
                  },
                },
              ],
            },
            {
              id: "201,18,123,172,231,231,176,43",
              creationAt: 1709279117,
              modifiedAt: 1709279117,
              type: "login",
              title: "Login with all custom fields",
              credentials: [
                {
                  type: "basic-auth",
                  urls: [
                    "https://custom.website.com",
                    "https://another.website.com",
                    "https://another",
                  ],
                  username: {
                    id: "142,77,101,233,56,72,225,23",
                    fieldType: "text",
                    value: "",
                    label: "Username",
                  },
                  password: {
                    id: "184,168,234,83,28,246,2,53",
                    fieldType: "password",
                    value: "",
                    label: "Password",
                  },
                },
              ],
            },
          ],
        },
      ],
      items: [],
      // "extensions": [],
    },
  ],
};
export const foldersString = JSON.stringify(folders);
