import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2CellEditionComponent } from './imperia-table-v2-cell-edition.component';

describe('ImperiaTableCellEditableTemplatesComponent', () => {
  let component: ImperiaTableV2CellEditionComponent;
  let fixture: ComponentFixture<ImperiaTableV2CellEditionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV2CellEditionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2CellEditionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
