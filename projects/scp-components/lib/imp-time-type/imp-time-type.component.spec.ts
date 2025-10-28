import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpTimeTypeComponent } from './imp-time-type.component';

describe('ImpTimeTypeComponent', () => {
  let component: ImpTimeTypeComponent;
  let fixture: ComponentFixture<ImpTimeTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpTimeTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpTimeTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
