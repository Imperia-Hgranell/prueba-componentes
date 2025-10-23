import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableFilterV2Component } from './imperia-table-filter-v2.component';

describe('ImperiaTableFilterV2Component', () => {
  let component: ImperiaTableFilterV2Component;
  let fixture: ComponentFixture<ImperiaTableFilterV2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableFilterV2Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableFilterV2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
