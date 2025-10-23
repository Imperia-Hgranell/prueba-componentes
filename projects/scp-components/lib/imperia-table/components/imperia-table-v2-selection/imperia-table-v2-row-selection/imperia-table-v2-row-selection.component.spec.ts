import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2RowSelectionComponent } from './imperia-table-v2-row-selection.component';

describe('ImperiaTableV2SelectionComponent', () => {
  let component: ImperiaTableV2RowSelectionComponent;
  let fixture: ComponentFixture<ImperiaTableV2RowSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV2RowSelectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2RowSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
