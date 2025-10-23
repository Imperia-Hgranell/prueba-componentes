import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3FilterDateComponent } from './imperia-table-v3-filter-date.component';

describe('ImperiaTableV2FilterDateComponent', () => {
  let component: ImperiaTableV3FilterDateComponent;
  let fixture: ComponentFixture<ImperiaTableV3FilterDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV3FilterDateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3FilterDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
