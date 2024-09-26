import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";

import { LoginEmailServiceAbstraction } from "@bitwarden/auth/common";

import { ExtensionLoginService } from "./extension-login.service";

describe("ExtensionLoginService", () => {
  let service: ExtensionLoginService;
  let routerMock: jest.Mocked<Router>;
  let loginEmailServiceMock: jest.Mocked<LoginEmailServiceAbstraction>;

  beforeEach(() => {
    routerMock = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    loginEmailServiceMock = {
      clearValues: jest.fn(),
    } as unknown as jest.Mocked<LoginEmailServiceAbstraction>;

    TestBed.configureTestingModule({
      providers: [
        ExtensionLoginService,
        { provide: Router, useValue: routerMock },
        { provide: LoginEmailServiceAbstraction, useValue: loginEmailServiceMock },
      ],
    });

    service = TestBed.inject(ExtensionLoginService);
  });

  it("creates the service", () => {
    expect(service).toBeTruthy();
  });

  describe("handleSuccessfulLogin", () => {
    it("clears login email service values and navigates to vault", async () => {
      await service.handleSuccessfulLogin();

      expect(loginEmailServiceMock.clearValues).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(["/tabs/vault"]);
    });
  });
});
