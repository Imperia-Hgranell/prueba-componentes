import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaIconButtonComponent } from './imperia-icon-button.component';

describe('ImperiaIconComponent', () => {
  let component: ImperiaIconButtonComponent;
  let fixture: ComponentFixture<ImperiaIconButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImperiaIconButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaIconButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
