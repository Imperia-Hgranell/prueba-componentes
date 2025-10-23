import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3SearchComponent } from './imperia-table-v3-search.component';

describe('ImperiaTableV2SearchComponent', () => {
  let component: ImperiaTableV3SearchComponent;
  let fixture: ComponentFixture<ImperiaTableV3SearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV3SearchComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
