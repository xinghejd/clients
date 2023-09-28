import { Subject } from "rxjs";

describe("toEmit", () => {
  let subject: Subject<boolean>;

  beforeEach(() => {
    subject = new Subject<boolean>();
  });

  afterEach(() => {
    subject.complete();
  });

  it("should pass if the observable emits", () => {
    subject.next(true);
    expect(subject).toEmit();
  });

  it("should fail if the observable does not emit", () => {
    expect(subject).not.toEmit(1);
  });

  it("should fail if the observable emits after the timeout", () => {
    setTimeout(() => subject.next(true), 100);
    expect(subject).not.toEmit(1);
  });
});

describe("toEmitValue", () => {
  let subject: Subject<boolean>;

  beforeEach(() => {
    subject = new Subject<boolean>();
  });

  it("should pass if the observable emits the expected value", () => {
    subject.next(true);
    expect(subject).toEmitValue(true);
  });

  it("should fail if the observable does not emit the expected value", () => {
    subject.next(true);
    expect(subject).not.toEmitValue(false);
  });

  it("should fail if the observable does not emit anything", () => {
    expect(subject).not.toEmitValue(true);
  });

  it("should fail if the observable emits the expected value after the timeout", () => {
    setTimeout(() => subject.next(true), 100);
    expect(subject).not.toEmitValue(true);
  });
});
