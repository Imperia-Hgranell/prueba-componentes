import { InputSignal, Signal, TemplateRef } from '@angular/core';
import { PaginationValue } from '@imperiascm/scp-utils/payload';
import { Observable } from 'rxjs';

export interface ImperiaTablePagination {
  $page: InputSignal<number>;
  $size: InputSignal<number>;
  valueChange$: Observable<PaginationValue>;
  $buttonRowTemplate?: Signal<TemplateRef<any>>;
}
