import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpToggleComponent } from './imp-toggle.component';

describe('ImpToggleComponent', () => {
  let component: ImpToggleComponent;
  let fixture: ComponentFixture<ImpToggleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpToggleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
