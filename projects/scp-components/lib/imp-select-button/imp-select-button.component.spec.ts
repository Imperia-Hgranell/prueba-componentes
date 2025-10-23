import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpSelectButtonComponent } from './imp-select-button.component';

describe('ImpSelectButtonComponent', () => {
  let component: ImpSelectButtonComponent;
  let fixture: ComponentFixture<ImpSelectButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpSelectButtonComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpSelectButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
