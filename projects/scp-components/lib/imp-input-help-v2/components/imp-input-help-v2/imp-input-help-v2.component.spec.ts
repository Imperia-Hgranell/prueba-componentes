import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImpInputHelpV2Component } from './imp-input-help-v2.component';

describe('ImpInputHelpV2Component', () => {
  let component: ImpInputHelpV2Component;
  let fixture: ComponentFixture<ImpInputHelpV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpInputHelpV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpInputHelpV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
>