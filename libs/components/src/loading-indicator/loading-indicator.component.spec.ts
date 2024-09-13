import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { mock } from "jest-mock-extended";

import { I18nPipe } from "@bitwarden/angular/platform/pipes/i18n.pipe";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

import { LoadingIndicatorComponent } from "./loading-indicator.component";



describe("LoadingIndicatorComponent", () => {
  let fixture: ComponentFixture<LoadingIndicatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoadingIndicatorComponent, I18nPipe],
      providers: [
        {
          provide: I18nService,
          useValue: mock<I18nService>({ t: (key) => key }),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingIndicatorComponent);
    fixture.detectChanges();
  });

  it("should set the title attribute with the translated text", () => {
    const iconElement = fixture.debugElement.query(By.css("i")).nativeElement;
    expect(iconElement.getAttribute("title")).toBe("loading");
  });

  it("should render the visually hidden span with the translated text", () => {
    const spanElement = fixture.debugElement.query(By.css("span")).nativeElement;
    expect(spanElement.textContent).toBe("loading");
    expect(spanElement.classList).toContain("tw-sr-only");
  });
});
