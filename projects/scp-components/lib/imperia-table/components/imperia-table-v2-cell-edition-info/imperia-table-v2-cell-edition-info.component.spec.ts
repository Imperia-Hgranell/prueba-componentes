import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2CellEditionInfoComponent } from './imperia-table-v2-cell-edition-info.component';

describe('ImperiaTableV2CellEditionInfoComponent', () => {
  let component: ImperiaTableV2CellEditionInfoComponent;
  let fixture: ComponentFixture<ImperiaTableV2CellEditionInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV2CellEditionInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2CellEditionInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
