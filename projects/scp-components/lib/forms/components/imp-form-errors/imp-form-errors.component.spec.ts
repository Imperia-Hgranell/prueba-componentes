import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpFormErrorsComponent } from './imp-form-errors.component';

describe('ImpFormErrorsComponent', () => {
  let component: ImpFormErrorsComponent;
  let fixture: ComponentFixture<ImpFormErrorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpFormErrorsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpFormErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
