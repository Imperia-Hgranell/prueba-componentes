import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpProgressBarComponent } from './imp-progress-bar.component';

describe('ImpProgressBarComponent', () => {
  let component: ImpProgressBarComponent;
  let fixture: ComponentFixture<ImpProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpProgressBarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
