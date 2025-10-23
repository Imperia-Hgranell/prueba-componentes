import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3ColumnsGroupsComponent } from './imperia-table-v3-columns-groups.component';

describe('ImperiaTableV3ColumnsGroupsComponent', () => {
  let component: ImperiaTableV3ColumnsGroupsComponent;
  let fixture: ComponentFixture<ImperiaTableV3ColumnsGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV3ColumnsGroupsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3ColumnsGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
