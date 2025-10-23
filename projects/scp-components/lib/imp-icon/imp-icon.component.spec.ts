import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpIconComponent } from './imp-icon.component';

describe('ImpIconComponent', () => {
  let component: ImpIconComponent;
  let fixture: ComponentFixture<ImpIconComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpIconComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
