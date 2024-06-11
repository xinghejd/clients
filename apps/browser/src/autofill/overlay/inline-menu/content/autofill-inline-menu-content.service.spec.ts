import { AutofillInlineMenuContentService } from "./autofill-inline-menu-content.service";

describe("AutofillInlineMenuContentService", () => {
  let autofillInlineMenuContentService: AutofillInlineMenuContentService;

  beforeEach(() => {
    autofillInlineMenuContentService = new AutofillInlineMenuContentService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("isElementInlineMenu", () => {
    it("returns true if the passed element is the inline menu", () => {
      const element = document.createElement("div");
      autofillInlineMenuContentService["listElement"] = element;

      expect(autofillInlineMenuContentService.isElementInlineMenu(element)).toBe(true);
    });
  });

  describe("extension message handlers", () => {});
});
