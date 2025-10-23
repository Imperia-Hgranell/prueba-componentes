import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3FiltersComponent } from './imperia-table-v3-filters.component';

describe('ImperiaTableV2FiltersComponent', () => {
  let component: ImperiaTableV3FiltersComponent;
  let fixture: ComponentFixture<ImperiaTableV3FiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV3FiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3FiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
