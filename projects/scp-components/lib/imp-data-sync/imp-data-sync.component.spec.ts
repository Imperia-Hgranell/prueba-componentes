import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpCrudMessagesComponent } from './imp-data-sync.component';

describe('ImpCrudMessagesComponent', () => {
  let component: ImpCrudMessagesComponent<any>;
  let fixture: ComponentFixture<ImpCrudMessagesComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpCrudMessagesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpCrudMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
