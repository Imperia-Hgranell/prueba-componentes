import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV3LoadingComponent } from './imperia-table-v3-loading.component';

describe('ImperiaTableV2LoadingComponent', () => {
  let component: ImperiaTableV3LoadingComponent;
  let fixture: ComponentFixture<ImperiaTableV3LoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImperiaTableV3LoadingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV3LoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
