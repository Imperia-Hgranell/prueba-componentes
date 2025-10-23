import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpInputTextareaComponent } from './imp-input-textarea.component';

describe('ImpInputTextareaComponent', () => {
  let component: ImpInputTextareaComponent;
  let fixture: ComponentFixture<ImpInputTextareaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpInputTextareaComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpInputTextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
