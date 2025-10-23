import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3Component } from './imperia-table-v3.component';

describe('ImperiaTableV3Component', () => {
  let component: ImperiaTableV3Component;
  let fixture: ComponentFixture<ImperiaTableV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV3Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
