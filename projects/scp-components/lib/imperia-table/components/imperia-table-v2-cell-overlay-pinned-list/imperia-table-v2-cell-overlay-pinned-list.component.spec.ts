import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2CellOverlayPinnedListComponent } from './imperia-table-v2-cell-overlay-pinned-list.component';

describe('ImperiaTableV2CellOverlayPinnedListComponent', () => {
  let component: ImperiaTableV2CellOverlayPinnedListComponent;
  let fixture: ComponentFixture<ImperiaTableV2CellOverlayPinnedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV2CellOverlayPinnedListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2CellOverlayPinnedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
