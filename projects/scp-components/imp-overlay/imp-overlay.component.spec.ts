import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpOverlayComponent } from './imp-overlay.component';

describe('ImpOverlayComponent', () => {
  let component: ImpOverlayComponent;
  let fixture: ComponentFixture<ImpOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpOverlayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
