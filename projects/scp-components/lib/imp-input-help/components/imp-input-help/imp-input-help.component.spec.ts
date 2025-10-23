import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpInputHelpComponent } from './imp-input-help.component';

describe('ImpSelectComponent', () => {
  let component: ImpInputHelpComponent<any>;
  let fixture: ComponentFixture<ImpInputHelpComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpInputHelpComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpInputHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
