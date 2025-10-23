import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpFormUnsavedChangesCheckerComponent } from './imp-form-unsaved-changes-checker.component';

describe('ImpFormUnsavedChangesCheckerComponent', () => {
  let component: ImpFormUnsavedChangesCheckerComponent;
  let fixture: ComponentFixture<ImpFormUnsavedChangesCheckerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpFormUnsavedChangesCheckerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpFormUnsavedChangesCheckerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
