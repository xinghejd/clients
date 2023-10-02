import { MockProxy, mock } from "jest-mock-extended";
import { Jsonify } from "type-fest";

import { mockEnc, mockFromJson } from "../../../../spec";
import { UriMatchType } from "../../../enums";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { EncString } from "../../../platform/models/domain/enc-string";
import { LoginUriData } from "../data/login-uri.data";

import { LoginUri } from "./login-uri";

describe("LoginUri", () => {
  let data: LoginUriData;

  beforeEach(() => {
    data = {
      uri: "encUri",
      match: UriMatchType.Domain,
    };
  });

  it("Convert from empty", () => {
    const data = new LoginUriData();
    const loginUri = new LoginUri(data);

    expect(loginUri).toEqual({
      match: null,
      uri: null,
    });
  });

  it("Convert", () => {
    const loginUri = new LoginUri(data);

    expect(loginUri).toEqual({
      match: 0,
      uri: { encryptedString: "encUri", encryptionType: 0 },
    });
  });

  it("toLoginUriData", () => {
    const loginUri = new LoginUri(data);
    expect(loginUri.toLoginUriData()).toEqual(data);
  });

  it("Decrypt", async () => {
    const loginUri = new LoginUri();
    loginUri.match = UriMatchType.Exact;
    loginUri.uri = mockEnc("uri");

    const view = await loginUri.decrypt(null);

    expect(view).toEqual({
      _canLaunch: null,
      _domain: null,
      _host: null,
      _hostname: null,
      _uri: "uri",
      match: 3,
    });
  });

  describe("validateChecksum", () => {
    let cryptoService: MockProxy<CryptoService>;

    beforeEach(() => {
      cryptoService = mock();
      global.bitwardenContainerService = {
        getCryptoService: () => cryptoService,
        getEncryptService: () => null,
      };
    });

    it("returns true if checksums match", async () => {
      const loginUri = new LoginUri();
      loginUri.uriChecksum = mockEnc("checksum");
      cryptoService.hash.mockResolvedValue("checksum");

      const actual = await loginUri.validateChecksum("uri", null, null);

      expect(actual).toBe(true);
      expect(cryptoService.hash).toHaveBeenCalledWith("uri", "sha256");
    });

    it("returns false if checksums don't match", async () => {
      const loginUri = new LoginUri();
      loginUri.uriChecksum = mockEnc("checksum");
      cryptoService.hash.mockResolvedValue("incorrect checksum");

      const actual = await loginUri.validateChecksum("uri", null, null);

      expect(actual).toBe(false);
    });

    it("returns true if LoginUri doesn't have a checksum", async () => {
      const loginUri = new LoginUri();
      loginUri.uriChecksum = null;
      cryptoService.hash.mockResolvedValue("checksum");

      const actual = await loginUri.validateChecksum("uri", null, null);

      expect(actual).toBe(true);
    });
  });

  describe("fromJSON", () => {
    it("initializes nested objects", () => {
      jest.spyOn(EncString, "fromJSON").mockImplementation(mockFromJson);

      const actual = LoginUri.fromJSON({
        uri: "myUri",
        uriChecksum: "myUriChecksum",
        match: UriMatchType.Domain,
      } as Jsonify<LoginUri>);

      expect(actual).toEqual({
        uri: "myUri_fromJSON",
        uriChecksum: "myUriChecksum_fromJSON",
        match: UriMatchType.Domain,
      });
      expect(actual).toBeInstanceOf(LoginUri);
    });

    it("returns null if object is null", () => {
      expect(LoginUri.fromJSON(null)).toBeNull();
    });
  });
});
