import { TestBed } from '@angular/core/testing';

import { UnsavedChangesCheckerGuard } from './unsaved-changes-checker.guard';

describe('UnsavedChangesCheckerGuard', () => {
  let guard: UnsavedChangesCheckerGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(UnsavedChangesCheckerGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
