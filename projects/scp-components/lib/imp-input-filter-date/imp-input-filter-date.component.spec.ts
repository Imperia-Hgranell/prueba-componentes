import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpInputFilterDateComponent } from './imp-input-filter-date.component';

describe('ImpInputFilterDateComponent', () => {
  let component: ImpInputFilterDateComponent;
  let fixture: ComponentFixture<ImpInputFilterDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpInputFilterDateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpInputFilterDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
