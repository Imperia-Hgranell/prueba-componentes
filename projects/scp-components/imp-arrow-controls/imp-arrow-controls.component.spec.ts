import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpArrowControls } from './imp-arrow-controls.component';

describe('ImpArrowControls', () => {
  let component: ImpArrowControls;
  let fixture: ComponentFixture<ImpArrowControls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpArrowControls],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpArrowControls);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
