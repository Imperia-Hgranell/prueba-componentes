import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3FilterStringComponent } from './imperia-table-v3-filter-string.component';

describe('ImperiaTableV2FilterStringComponent', () => {
  let component: ImperiaTableV3FilterStringComponent;
  let fixture: ComponentFixture<ImperiaTableV3FilterStringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV3FilterStringComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3FilterStringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
