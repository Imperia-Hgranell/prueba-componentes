import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaInputTableComponent } from './imperia-input-table.component';

describe('ImperiaInputComponent', () => {
  let component: ImperiaInputTableComponent<any>;
  let fixture: ComponentFixture<ImperiaInputTableComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImperiaInputTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaInputTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
