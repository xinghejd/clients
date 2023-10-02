import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";

import AutofillOverlayList from "./autofill-overlay-list";

describe("AutofillOverlayList", () => {
  globalThis.customElements.define("autofill-overlay-list", AutofillOverlayList);
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  let autofillOverlayList: AutofillOverlayList;
  const translations = {
    locale: "en",
    buttonPageTitle: "buttonPageTitle",
  };

  beforeEach(() => {
    document.body.innerHTML = `<autofill-overlay-list></autofill-overlay-list>`;
    autofillOverlayList = document.querySelector("autofill-overlay-list");
    jest.spyOn(globalThis.document, "createElement");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("initAutofillOverlayList", () => {
    it("initializes the overlay list and updates the list items with the passed ciphers", () => {
      const updateListItemsSpy = jest.spyOn(autofillOverlayList as any, "updateListItems");
      const message = {
        command: "initAutofillOverlayList",
        translations,
        styleSheetUrl: "https://tacos.com",
        authStatus: AuthenticationStatus.Unlocked,
        ciphers: [
          {
            id: "1",
            name: "1",
            login: { username: "1" },
            type: CipherType.Login,
            reprompt: CipherRepromptType.None,
            favorite: false,
            icon: { imageEnabled: false, image: "", fallbackImage: "", icon: "bw-icon" },
          },
        ],
      };

      autofillOverlayList["initAutofillOverlayList"](message);

      expect(updateListItemsSpy).toHaveBeenCalledWith(message.ciphers);
    });

    it("initializes the overlay list and builds the locked overlay if the auth status is not `Unlocked`", () => {
      const buildLockedOverlaySpy = jest.spyOn(autofillOverlayList as any, "buildLockedOverlay");

      autofillOverlayList["initAutofillOverlayList"]({
        command: "initAutofillOverlayList",
        translations,
        styleSheetUrl: "https://tacos.com",
        authStatus: AuthenticationStatus.Locked,
        ciphers: [],
      });

      expect(buildLockedOverlaySpy).toHaveBeenCalled();
    });
  });
});
