import { DIALOG_DATA, DialogRef } from "@angular/cdk/dialog";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { mock, MockProxy } from "jest-mock-extended";
import { of } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { PolicyType } from "@bitwarden/common/admin-console/enums";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions/account/billing-account-profile-state.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { FolderService } from "@bitwarden/common/vault/abstractions/folder/folder.service.abstraction";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { DialogService } from "@bitwarden/components";
import { DefaultCipherFormConfigService } from "@bitwarden/vault";

import { AddEditCipherDialogParams, AddEditComponentV2 } from "./add-edit-v2.component";

describe("AddEditComponentV2", () => {
  let component: AddEditComponentV2;
  let fixture: ComponentFixture<AddEditComponentV2>;
  let router: Router;
  let organizationService: MockProxy<OrganizationService>;
  let policyService: MockProxy<PolicyService>;
  let billingAccountProfileStateService: MockProxy<BillingAccountProfileStateService>;
  let activatedRoute: MockProxy<ActivatedRoute>;
  let dialogRef: MockProxy<DialogRef<any>>;
  let dialogService: MockProxy<DialogService>;
  let cipherService: MockProxy<CipherService>;
  let messagingService: MockProxy<MessagingService>;
  let folderService: MockProxy<FolderService>;
  let collectionService: MockProxy<CollectionService>;

  const mockCipher: CipherView = {
    id: "cipher-id",
    type: 1,
    organizationId: "org-id",
    isDeleted: false,
  } as CipherView;

  const mockParams: AddEditCipherDialogParams = {
    cipher: mockCipher,
  };

  beforeEach(async () => {
    const mockOrganization: Organization = {
      id: "org-id",
      name: "Test Organization",
    } as Organization;

    organizationService = mock<OrganizationService>();
    organizationService.organizations$ = of([mockOrganization]);

    policyService = mock<PolicyService>();
    policyService.policyAppliesToActiveUser$.mockImplementation((policyType: PolicyType) =>
      of(true),
    );

    billingAccountProfileStateService = mock<BillingAccountProfileStateService>();
    billingAccountProfileStateService.hasPremiumFromAnySource$ = of(true);

    activatedRoute = mock<ActivatedRoute>();
    activatedRoute.queryParams = of({});

    dialogRef = mock<DialogRef<any>>();
    dialogService = mock<DialogService>();
    messagingService = mock<MessagingService>();
    folderService = mock<FolderService>();
    folderService.folderViews$ = of([]);
    collectionService = mock<CollectionService>();
    collectionService.decryptedCollections$ = of([]);

    const mockDefaultCipherFormConfigService = {
      buildConfig: jest.fn().mockResolvedValue({
        allowPersonal: true,
        allowOrganization: true,
      }),
    };

    await TestBed.configureTestingModule({
      imports: [AddEditComponentV2],
      providers: [
        { provide: DIALOG_DATA, useValue: mockParams },
        { provide: DialogRef, useValue: dialogRef },
        { provide: I18nService, useValue: { t: jest.fn().mockReturnValue("login") } },
        { provide: DialogService, useValue: dialogService },
        { provide: CipherService, useValue: cipherService },
        { provide: MessagingService, useValue: messagingService },
        { provide: OrganizationService, useValue: organizationService },
        { provide: Router, useValue: mock<Router>() },
        { provide: ActivatedRoute, useValue: activatedRoute },
        { provide: CollectionService, useValue: collectionService },
        { provide: FolderService, useValue: folderService },
        { provide: CryptoService, useValue: mock<CryptoService>() },
        { provide: BillingAccountProfileStateService, useValue: billingAccountProfileStateService },
        { provide: PolicyService, useValue: policyService },
        { provide: DefaultCipherFormConfigService, useValue: mockDefaultCipherFormConfigService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditComponentV2);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    component.params = mockParams;
    component.cipher = mockCipher;
  });

  describe("ngOnInit", () => {
    it("initializes the component with cipher", async () => {
      await component.ngOnInit();

      expect(component.cipher).toEqual(mockCipher);
      expect(component.cipherId).toEqual(mockCipher.id);
    });
  });

  describe("onCipherSaved", () => {
    it("handles cipher saved event", async () => {
      const spyClose = jest.spyOn(dialogRef, "close");
      const spyEmit = jest.spyOn(component.onSavedCipher, "emit");
      const spySend = jest.spyOn(messagingService, "send");
      const spyNavigate = jest.spyOn(router, "navigate").mockResolvedValue(true);

      await component.onCipherSaved(mockCipher);

      expect(spyClose).toHaveBeenCalledWith({ action: "added" });
      expect(spyEmit).toHaveBeenCalledWith(mockCipher);
      expect(spySend).toHaveBeenCalledWith("addedCipher");
      expect(spyNavigate).toHaveBeenCalledWith([], {
        queryParams: {
          itemId: null,
          action: null,
        },
      });
    });
  });

  describe("edit", () => {
    it("handles cipher editing", async () => {
      const spyClose = jest.spyOn(dialogRef, "close");
      const spyNavigate = jest.spyOn(router, "navigate").mockResolvedValue(true);

      await component.edit();

      expect(spyClose).toHaveBeenCalledWith({ action: "edited" });
      expect(spyNavigate).toHaveBeenCalledWith([], {
        queryParams: {
          itemId: mockCipher.id,
          action: "edit",
          organizationId: mockCipher.organizationId,
        },
      });
    });
  });

  describe("cancel", () => {
    it("handles cancel action", async () => {
      const spyClose = jest.spyOn(dialogRef, "close");
      const spyNavigate = jest.spyOn(router, "navigate").mockResolvedValue(true);

      await component.cancel();

      expect(spyClose).toHaveBeenCalled();
      expect(spyNavigate).toHaveBeenCalledWith([], {
        queryParams: {
          itemId: null,
          action: null,
          organizationId: null,
        },
      });
    });
  });
});
