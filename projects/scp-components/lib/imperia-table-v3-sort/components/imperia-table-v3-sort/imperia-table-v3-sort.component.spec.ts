import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3SortComponent } from './imperia-table-v3-sort.component';

describe('ImperiaTableV2SortComponent', () => {
  let component: ImperiaTableV3SortComponent;
  let fixture: ComponentFixture<ImperiaTableV3SortComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV3SortComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3SortComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
