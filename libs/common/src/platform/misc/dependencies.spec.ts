import { mock, MockProxy } from "jest-mock-extended";
import { BehaviorSubject, firstValueFrom, Subject } from "rxjs";

import { mockAccountServiceWith, ObservableTracker } from "../../../spec";
import { AuthService } from "../../auth/abstractions/auth.service";
import { AuthenticationStatus } from "../../auth/enums/authentication-status";
import { UserId } from "../../types/guid";

import { buildSingleValueObservable, currentActiveUser } from "./dependencies";

describe("currentActiveUser", () => {
  const mockUserId = "mockUserId" as UserId;
  const accountService = mockAccountServiceWith(mockUserId);
  let authService: MockProxy<AuthService>;
  let authStatusForSubject: BehaviorSubject<AuthenticationStatus>;

  beforeEach(() => {
    authService = mock<AuthService>();
    authStatusForSubject = new BehaviorSubject<AuthenticationStatus>(AuthenticationStatus.Unlocked);
    authService.authStatusFor$.mockReturnValue(authStatusForSubject.asObservable());
  });

  afterEach(() => {
    jest.resetAllMocks();
    if (!authStatusForSubject.closed) {
      authStatusForSubject.complete();
    }
  });

  it("emits the current active user", async () => {
    const sut = currentActiveUser(accountService, authService).singleUserId$;
    const tracker = new ObservableTracker(sut);

    const [result] = await tracker.pauseUntilReceived(1);

    expect(result).toEqual(mockUserId);
  });

  it("does not emit when the user changes", async () => {
    const sut = currentActiveUser(accountService, authService);
    const tracker = new ObservableTracker(sut.singleUserId$);

    await accountService.addAccount("newUserId" as UserId, {
      name: "newName",
      email: "newEmail",
      emailVerified: true,
    });

    await accountService.switchAccount("newUserId" as UserId);

    await expect(tracker.pauseUntilReceived(2)).rejects.toThrow();
  });

  it("completes when the user is logged out and logged out is a complete event", async () => {
    const sut = currentActiveUser(accountService, authService, {
      completeOn: ["logout"],
    });

    let completed = false;
    sut.singleUserId$.subscribe({
      complete: () => {
        completed = true;
      },
    });

    authStatusForSubject.next(AuthenticationStatus.LoggedOut);

    expect(completed).toBe(true);
  });

  it("completes when the user is logged out and lock is a complete event", async () => {
    const sut = currentActiveUser(accountService, authService, {
      completeOn: ["lock"],
    });

    let completed = false;
    sut.singleUserId$.subscribe({
      complete: () => {
        completed = true;
      },
    });

    authStatusForSubject.next(AuthenticationStatus.LoggedOut);

    expect(completed).toBe(true);
  });

  it("completes when the user is locked and lock is a complete event", async () => {
    const sut = currentActiveUser(accountService, authService, {
      completeOn: ["lock"],
    });

    let completed = false;
    sut.singleUserId$.subscribe({
      complete: () => {
        completed = true;
      },
    });

    authStatusForSubject.next(AuthenticationStatus.Locked);

    expect(completed).toBe(true);
  });

  it("does not complete when the user is locked and only logout is a complete event", async () => {
    const sut = currentActiveUser(accountService, authService, {
      completeOn: ["logout"],
    });

    let completed = false;
    sut.singleUserId$.subscribe({
      complete: () => {
        completed = true;
      },
    });

    authStatusForSubject.next(AuthenticationStatus.Locked);

    expect(completed).toBe(false);
  });
});

describe("buildSingleValueObservable", () => {
  let subject: Subject<number>;
  let destroySubject: Subject<void>;

  beforeEach(() => {
    subject = new Subject<number>();
    destroySubject = new Subject<void>();
  });

  afterEach(() => {
    if (!subject.closed) {
      subject.complete();
    }
    if (!destroySubject.closed) {
      destroySubject.complete();
    }
  });

  it("emits the value when the dependency emits", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject);

    const tracker = new ObservableTracker(sut);

    subject.next(42);

    const [result] = await tracker.pauseUntilReceived(1);

    expect(result).toBe(42);
  });

  it("completes when the dependency completes", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject);

    const tracker = new ObservableTracker(sut);

    subject.next(42);
    subject.complete();

    expect(tracker.complete).toBe(true);
  });

  it("emits an error when the dependency changes", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject);

    const tracker = new ObservableTracker(sut);

    subject.next(42);
    subject.next(43);

    expect(tracker.errors).toEqual([{ expectedValue: 42, actualValue: 43 }]);
  });

  it("does not emit when configured not to null", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject, { errorOnChange: false });

    const tracker = new ObservableTracker(sut);

    subject.next(42);
    subject.next(43);

    await expect(tracker.expectEmission()).rejects.toThrow(); // does not receive another emission

    expect(tracker.emissions).toEqual([42]);
    expect(tracker.errors).toEqual([]);
  });

  it("uses the comparer to compare values", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject, {
      comparer: (prev, next) => prev % 2 === next % 2,
    });

    const tracker = new ObservableTracker(sut);

    subject.next(42);
    subject.next(43);
    subject.next(44);

    await expect(tracker.expectEmission()).rejects.toThrow(); // does not receive another emission

    expect(tracker.emissions).toEqual([42]);
    expect(tracker.errors).toEqual([{ expectedValue: 42, actualValue: 43 }]); // only one error thrown
  });

  it("completes when the destroy is triggered", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject);

    const tracker = new ObservableTracker(sut);

    destroySubject.next();

    expect(tracker.complete).toBe(true);
  });

  it("shares existing values", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject, { errorOnChange: false });

    const tracker1 = new ObservableTracker(sut);

    subject.next(42);
    subject.next(43);

    const tracker2 = new ObservableTracker(sut);

    subject.next(44);

    await expect(tracker1.expectEmission()).rejects.toThrow(); // does not receive another emission

    expect(tracker1.emissions).toEqual(tracker2.emissions);
    expect(tracker2.emissions).toEqual([42]);
  });

  it("goes cold when the destroy is triggered", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject);

    const tracker = new ObservableTracker(sut);

    subject.next(42);
    destroySubject.next();

    subject.next(43);

    await expect(tracker.expectEmission()).rejects.toThrow(); // does not receive another emission

    expect(tracker.emissions).toEqual([42]);
    expect(tracker.errors).toEqual([]);
  });

  it("throws when subscribed to after completion", async () => {
    const sut = buildSingleValueObservable(subject, destroySubject);

    destroySubject.next();

    await expect(firstValueFrom(sut)).rejects.toThrow("Stream has been destroyed");
  });
});
