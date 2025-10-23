import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpMenuV2Component } from './imp-menu-v2.component';

describe('ImpMenuV2Component', () => {
  let component: ImpMenuV2Component;
  let fixture: ComponentFixture<ImpMenuV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpMenuV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpMenuV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
