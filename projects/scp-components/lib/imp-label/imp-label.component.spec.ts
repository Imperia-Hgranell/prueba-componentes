import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpLabelComponent } from './imp-label.component';

describe('ImpLabelComponent', () => {
  let component: ImpLabelComponent;
  let fixture: ComponentFixture<ImpLabelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpLabelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
