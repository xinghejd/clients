import { ComponentFixture, TestBed } from "@angular/core/testing";
import { mock, MockProxy } from "jest-mock-extended";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import { CipherFormContainer } from "../../cipher-form-container";

import { AdditionalOptionsSectionComponent } from "./additional-options-section.component";

describe("AdditionalOptionsSectionComponent", () => {
  let component: AdditionalOptionsSectionComponent;
  let fixture: ComponentFixture<AdditionalOptionsSectionComponent>;
  let cipherFormProvider: MockProxy<CipherFormContainer>;

  beforeEach(async () => {
    cipherFormProvider = mock<CipherFormContainer>();
    await TestBed.configureTestingModule({
      imports: [AdditionalOptionsSectionComponent],
      providers: [
        { provide: CipherFormContainer, useValue: cipherFormProvider },
        { provide: I18nService, useValue: mock<I18nService>() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdditionalOptionsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("registers 'additionalOptionsForm' form with CipherFormContainer", () => {
    expect(cipherFormProvider.registerChildForm).toHaveBeenCalledWith(
      "additionalOptions",
      component.additionalOptionsForm,
    );
  });

  it("patches 'additionalOptionsForm' changes to CipherFormContainer", () => {
    component.additionalOptionsForm.patchValue({
      notes: "new notes",
      reprompt: true,
    });

    expect(cipherFormProvider.patchCipher).toHaveBeenCalledWith({
      notes: "new notes",
      reprompt: 1,
    });
  });

  it("disables 'additionalOptionsForm' when in partial-edit mode", () => {
    cipherFormProvider.config.mode = "partial-edit";

    component.ngOnInit();

    expect(component.additionalOptionsForm.disabled).toBe(true);
  });

  it("initializes 'additionalOptionsForm' with original cipher view values", () => {
    (cipherFormProvider.originalCipherView as any) = {
      notes: "original notes",
      reprompt: 1,
    } as CipherView;

    component.ngOnInit();

    expect(component.additionalOptionsForm.value).toEqual({
      notes: "original notes",
      reprompt: true,
    });
  });
});
