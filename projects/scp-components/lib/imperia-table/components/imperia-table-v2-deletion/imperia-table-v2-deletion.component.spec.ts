import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2DeletionComponent } from './imperia-table-v2-deletion.component';

describe('ImperiaTableV2DeletionComponent', () => {
  let component: ImperiaTableV2DeletionComponent;
  let fixture: ComponentFixture<ImperiaTableV2DeletionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV2DeletionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2DeletionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
