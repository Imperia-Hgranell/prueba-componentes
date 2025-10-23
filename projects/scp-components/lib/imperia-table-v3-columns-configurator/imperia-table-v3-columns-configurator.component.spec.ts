import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3ColumnsConfiguratorComponent } from './imperia-table-v3-columns-configurator.component';

describe('ImperiaTableV3ColumnsConfiguratorComponent', () => {
  let component: ImperiaTableV3ColumnsConfiguratorComponent;
  let fixture: ComponentFixture<ImperiaTableV3ColumnsConfiguratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImperiaTableV3ColumnsConfiguratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3ColumnsConfiguratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
