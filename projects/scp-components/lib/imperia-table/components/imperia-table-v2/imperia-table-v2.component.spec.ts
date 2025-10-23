import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2Component } from './imperia-table-v2.component';

describe('ImperiaTableV2Component', () => {
  let component: ImperiaTableV2Component;
  let fixture: ComponentFixture<ImperiaTableV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
