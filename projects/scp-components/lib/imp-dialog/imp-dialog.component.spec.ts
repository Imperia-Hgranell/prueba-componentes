import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpDialogComponent } from './imp-dialog.component';

describe('ImpDialogComponent', () => {
  let component: ImpDialogComponent;
  let fixture: ComponentFixture<ImpDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImpDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
