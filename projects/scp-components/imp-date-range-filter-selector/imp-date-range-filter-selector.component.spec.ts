import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpDateRangeFilterSelectorComponent } from './imp-date-range-filter-selector.component';

describe('ImpDateRangeFilterSelectorComponent', () => {
  let component: ImpDateRangeFilterSelectorComponent;
  let fixture: ComponentFixture<ImpDateRangeFilterSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpDateRangeFilterSelectorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpDateRangeFilterSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
