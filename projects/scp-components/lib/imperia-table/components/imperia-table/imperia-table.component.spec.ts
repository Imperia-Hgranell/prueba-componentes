import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TypedTranslateService } from '@shared/services/typed-translate.service';
import { ImperiaTableComponent } from './imperia-table.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ScpComponentsModule } from '../../scp-components.module';
import es from '../../../../../../assets/i18n/es.json';
import { Product } from '@modules/products/models/products.models';

fdescribe('ImperiaTableComponent', () => {
  let component: ImperiaTableComponent<Partial<Product>>;
  let fixture: ComponentFixture<ImperiaTableComponent<Partial<Product>>>;
  const mockTypedTranslationService = jasmine.createSpyObj<TypedTranslateService>(
    'TypedTranslateService',
    ['use'],
    { translation: es }
  );
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScpComponentsModule, HttpClientTestingModule],
      providers: [
        {
          provide: TypedTranslateService,
          useValue: mockTypedTranslationService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImperiaTableComponent<Partial<Product>>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a translation defined', () => {
    expect(
      component.typedTranslateService.translation.IMPERIA_TABLE
    ).toBeDefined();
  });

  it('should have an overlay panel', () => {
    expect(component.headerOverlayPanel).toBeDefined();
  });

  it('should have a p-table', () => {
    expect(component.table).toBeDefined();
  });
});
