import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3FilterNumberComponent } from './imperia-table-v3-filter-number.component';

describe('ImperiaTableV2FilterNumberComponent', () => {
  let component: ImperiaTableV3FilterNumberComponent;
  let fixture: ComponentFixture<ImperiaTableV3FilterNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV3FilterNumberComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3FilterNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
