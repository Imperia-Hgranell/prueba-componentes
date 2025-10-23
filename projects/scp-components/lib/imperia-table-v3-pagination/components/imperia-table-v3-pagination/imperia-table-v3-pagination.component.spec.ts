import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3PaginationComponent } from './imperia-table-v3-pagination.component';

describe('ImperiaTableV2PaginationComponent', () => {
  let component: ImperiaTableV3PaginationComponent;
  let fixture: ComponentFixture<ImperiaTableV3PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV3PaginationComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
