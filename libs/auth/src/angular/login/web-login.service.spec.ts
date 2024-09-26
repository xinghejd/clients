import { TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";

import { LoginComponentService } from "./login-component.service";
import { WebLoginService } from "./web-login.service";

describe("WebLoginService", () => {
  let service: WebLoginService;
  let routerMock: jest.Mocked<Router>;
  let loginComponentServiceMock: jest.Mocked<LoginComponentService>;

  beforeEach(() => {
    routerMock = {
      createUrlTree: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    loginComponentServiceMock = {
      setPreviousUrl: jest.fn(),
    } as unknown as jest.Mocked<LoginComponentService>;

    TestBed.configureTestingModule({
      providers: [
        WebLoginService,
        { provide: Router, useValue: routerMock },
        { provide: LoginComponentService, useValue: loginComponentServiceMock },
      ],
    });

    service = TestBed.inject(WebLoginService);
  });

  it("creates the service", () => {
    expect(service).toBeTruthy();
  });

  describe("handleQueryParams", () => {
    it("sets previous URL for organization creation when org param is present", async () => {
      const qParams = { org: "some-org" };
      const mockUrlTree = {} as any;
      routerMock.createUrlTree.mockReturnValue(mockUrlTree);

      await service.handleQueryParams(qParams);

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(["create-organization"], {
        queryParams: { plan: "some-org" },
      });
      expect(loginComponentServiceMock.setPreviousUrl).toHaveBeenCalledWith(mockUrlTree);
    });

    it("sets previous URL for families sponsorship when sponsorshipToken param is present", async () => {
      const qParams = { sponsorshipToken: "test-token" };
      const mockUrlTree = {} as any;
      routerMock.createUrlTree.mockReturnValue(mockUrlTree);

      await service.handleQueryParams(qParams);

      expect(routerMock.createUrlTree).toHaveBeenCalledWith(["setup/families-for-enterprise"], {
        queryParams: { token: "test-token" },
      });
      expect(loginComponentServiceMock.setPreviousUrl).toHaveBeenCalledWith(mockUrlTree);
    });

    it("does not set previous URL when no relevant params are present", async () => {
      const qParams = { someOtherParam: "value" };

      await service.handleQueryParams(qParams);

      expect(routerMock.createUrlTree).not.toHaveBeenCalled();
      expect(loginComponentServiceMock.setPreviousUrl).not.toHaveBeenCalled();
    });
  });
});
