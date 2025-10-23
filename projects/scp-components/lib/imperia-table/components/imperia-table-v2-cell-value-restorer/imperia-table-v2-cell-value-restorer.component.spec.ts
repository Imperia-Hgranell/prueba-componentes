import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2CellValueRestorerComponent } from './imperia-table-v2-cell-value-restorer.component';

describe('ImperiaTableV2CellValueRestorerComponent', () => {
  let component: ImperiaTableV2CellValueRestorerComponent;
  let fixture: ComponentFixture<ImperiaTableV2CellValueRestorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV2CellValueRestorerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2CellValueRestorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
