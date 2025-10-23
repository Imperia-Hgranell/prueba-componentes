import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpInputCalendarComponent } from './imp-input-calendar.component';

describe('ImpInputCalendarComponent', () => {
  let component: ImpInputCalendarComponent;
  let fixture: ComponentFixture<ImpInputCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpInputCalendarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpInputCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
