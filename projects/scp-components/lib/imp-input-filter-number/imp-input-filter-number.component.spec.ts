import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpInputFilterNumberComponent } from './imp-input-filter-number.component';

describe('ImpInputFilterNumberComponent', () => {
  let component: ImpInputFilterNumberComponent;
  let fixture: ComponentFixture<ImpInputFilterNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpInputFilterNumberComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpInputFilterNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
