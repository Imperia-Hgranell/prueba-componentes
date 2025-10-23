import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Product } from 'src/app/products/models/product.model';

import { ImperiaTableFilterComponent } from './imperia-table-filter.component';

describe('ImperiaTableFilterComponent', () => {
  let component: ImperiaTableFilterComponent<Product>;
  let fixture: ComponentFixture<ImperiaTableFilterComponent<Product>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ImperiaTableFilterComponent<Product> ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImperiaTableFilterComponent<Product>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
