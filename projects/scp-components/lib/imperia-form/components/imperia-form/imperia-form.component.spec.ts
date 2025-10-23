import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaFormComponent } from './imperia-form.component';

describe('ImperiaFormComponent', () => {
  let component: ImperiaFormComponent<any>;
  let fixture: ComponentFixture<ImperiaFormComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
