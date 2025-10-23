import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpUnitNameComponent } from './imp-unit-name.component';

describe('ImpUnitNameComponent', () => {
  let component: ImpUnitNameComponent;
  let fixture: ComponentFixture<ImpUnitNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpUnitNameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpUnitNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
