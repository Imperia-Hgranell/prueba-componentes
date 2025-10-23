import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2RowsConfiguratorComponent } from './imperia-table-v2-rows-configurator.component';

describe('ImperiaTableV2RowsConfiguratorComponent', () => {
  let component: ImperiaTableV2RowsConfiguratorComponent;
  let fixture: ComponentFixture<ImperiaTableV2RowsConfiguratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV2RowsConfiguratorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2RowsConfiguratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
