import { CredentialExchangeFormat } from "../../../src/importers/cef/types/cef-importer-types";

const creditCard: CredentialExchangeFormat = {
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
          id: "abc",
          creationAt: 1711017120,
          modifiedAt: 1711017120,
          type: "identity",
          title: "CreditCard title",
          subtitle: "CreditCard subtitle",
          credentials: [
            {
              type: "credit-card",
              number: "422242224222",
              fullName: "John Doe",
              cardType: "Visa",
              verificationNumber: "123",
              expiryDate: "01/26",
              validFrom: "01/24",
            },
          ],
          tags: [],
        },
      ],
      // "extensions": [],
    },
  ],
};
export const creditCardString = JSON.stringify(creditCard);
