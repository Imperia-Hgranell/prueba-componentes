import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpMenuComponent } from './imp-menu.component';

describe('ImpMenuComponent', () => {
  let component: ImpMenuComponent;
  let fixture: ComponentFixture<ImpMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpMenuComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImpMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
