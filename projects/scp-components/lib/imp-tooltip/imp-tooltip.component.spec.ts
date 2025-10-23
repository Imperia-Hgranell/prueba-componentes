import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpTooltipComponent } from './imp-tooltip.component';

describe('ImpTooltipComponent', () => {
  let component: ImpTooltipComponent;
  let fixture: ComponentFixture<ImpTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpTooltipComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
