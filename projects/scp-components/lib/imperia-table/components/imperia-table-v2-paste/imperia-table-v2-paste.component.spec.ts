import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImperiaTableV2PasteComponent } from './imperia-table-v2-paste.component';

describe('ImperiaTableV2PasteComponent', () => {
  let component: ImperiaTableV2PasteComponent;
  let fixture: ComponentFixture<ImperiaTableV2PasteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImperiaTableV2PasteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableV2PasteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
