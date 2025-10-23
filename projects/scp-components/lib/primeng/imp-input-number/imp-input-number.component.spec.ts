import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpInputNumberComponent } from './imp-input-number.component';

describe('ImpInputNumberComponent', () => {
  let component: ImpInputNumberComponent;
  let fixture: ComponentFixture<ImpInputNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpInputNumberComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpInputNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
