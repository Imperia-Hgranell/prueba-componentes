import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2CellOverlayComponent } from './imperia-table-v2-cell-overlay.component';

describe('ImperiaTableV2WithCellOverlayComponent', () => {
  let component: ImperiaTableV2CellOverlayComponent;
  let fixture: ComponentFixture<ImperiaTableV2CellOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV2CellOverlayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2CellOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
