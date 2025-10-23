import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2CellSelectionComponent } from './imperia-table-v2-cell-selection.component';

describe('ImperiaTableV2CellSelectionComponent', () => {
  let component: ImperiaTableV2CellSelectionComponent;
  let fixture: ComponentFixture<ImperiaTableV2CellSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV2CellSelectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2CellSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
