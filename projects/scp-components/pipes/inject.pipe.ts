import { Injector, Pipe, PipeTransform, StaticProvider } from '@angular/core';

@Pipe({
  name: 'inject',
  standalone: true,
})
export class InjectPipe implements PipeTransform {
  transform<T>(
    params: T,
    value: (params: T) => {
      providers: StaticProvider[];
      parent?: Injector;
      name?: string;
    }
  ): Injector {
    return Injector.create(value(params));
  }
}
