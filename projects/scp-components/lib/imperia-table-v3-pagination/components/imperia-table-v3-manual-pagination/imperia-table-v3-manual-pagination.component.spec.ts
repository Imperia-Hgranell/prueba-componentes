import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3ManualPaginationComponent } from './imperia-table-v3-manual-pagination.component';

describe('ImperiaTableV3ManualPaginationComponent', () => {
  let component: ImperiaTableV3ManualPaginationComponent;
  let fixture: ComponentFixture<ImperiaTableV3ManualPaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImperiaTableV3ManualPaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3ManualPaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
