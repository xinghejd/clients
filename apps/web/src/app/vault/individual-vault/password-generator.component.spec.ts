import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { ComponentFixture, fakeAsync, TestBed, tick } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";

import { PasswordGeneratorPolicyOptions } from "@bitwarden/common/admin-console/models/domain/password-generator-policy-options";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import {
  UsernameGenerationServiceAbstraction,
  PasswordGenerationServiceAbstraction,
  PasswordGeneratorOptions,
} from "@bitwarden/generator-legacy";

import {
  PasswordGeneratorComponent,
  PasswordGeneratorParams,
} from "./password-generator.component";

describe("PasswordGeneratorComponent", () => {
  let component: PasswordGeneratorComponent;
  let fixture: ComponentFixture<PasswordGeneratorComponent>;

  let mockPasswordGenerationService: MockProxy<PasswordGenerationServiceAbstraction>;
  let passwordOptions$: BehaviorSubject<[PasswordGeneratorOptions, PasswordGeneratorPolicyOptions]>;
  let dialogRef: MockProxy<DialogRef<any>>;
  let mockUsernameGenerationService: MockProxy<UsernameGenerationServiceAbstraction>;

  beforeEach(async () => {
    passwordOptions$ = new BehaviorSubject([
      {
        type: "password",
      },
      {
        minLength: 8,
        useNumbers: true,
        useSpecial: true,
      },
    ] as [PasswordGeneratorOptions, PasswordGeneratorPolicyOptions]);

    mockPasswordGenerationService = mock<PasswordGenerationServiceAbstraction>();
    mockPasswordGenerationService.getOptions$.mockReturnValue(passwordOptions$);

    dialogRef = mock<DialogRef<any>>();

    const mockDialogData: PasswordGeneratorParams = {};

    mockUsernameGenerationService = mock<UsernameGenerationServiceAbstraction>();

    await TestBed.configureTestingModule({
      imports: [PasswordGeneratorComponent, NoopAnimationsModule],
      providers: [
        {
          provide: PasswordGenerationServiceAbstraction,
          useValue: mockPasswordGenerationService,
        },
        {
          provide: DialogRef,
          useValue: dialogRef,
        },
        {
          provide: DIALOG_DATA,
          useValue: mockDialogData,
        },
        {
          provide: I18nService,
          useValue: mock<I18nService>(),
        },
        {
          provide: UsernameGenerationServiceAbstraction,
          useValue: mockUsernameGenerationService,
        },
        {
          provide: PlatformUtilsService,
          useValue: mock<PlatformUtilsService>(),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordGeneratorComponent);
    component = fixture.componentInstance;
  });

  it("initializes without errors", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("sets a password when passwordGenerated is called", fakeAsync(() => {
    const generatedPassword = "generated-password";
    mockPasswordGenerationService.generatePassword.mockResolvedValue(generatedPassword);

    component.passwordGenerated(generatedPassword);
    tick();

    expect(component.password).toBe(generatedPassword);
  }));

  it("closes the dialog with 'added' result when passwordAdded is called", () => {
    const closeSpy = jest.spyOn(dialogRef, "close");

    component.passwordAdded();

    expect(closeSpy).toHaveBeenCalledWith({
      action: "added",
      password: component.password,
    });
  });

  it("closes the dialog with 'closed' result when dialogClosed is called", () => {
    const closeSpy = jest.spyOn(dialogRef, "close");

    component.dialogClosed();

    expect(closeSpy).toHaveBeenCalledWith({
      action: "closed",
    });
  });
});
