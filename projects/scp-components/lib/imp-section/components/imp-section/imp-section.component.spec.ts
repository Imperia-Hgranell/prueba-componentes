import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpSectionComponent } from './imp-section.component';

describe('ImpSectionComponent', () => {
  let component: ImpSectionComponent;
  let fixture: ComponentFixture<ImpSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
