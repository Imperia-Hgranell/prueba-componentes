import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  combineLatestWith,
  map,
  of,
  tap,
} from 'rxjs';
import { ImperiaIconButtonComponent } from '../../../imperia-icon-button/imperia-icon-button.component';
import { SECTION_EXPANDED_KEY } from '../../models/imp-section.models';

interface ViewModel {
  expanded: boolean;
  contentWrapperHeight: number | null;
}

@Component({
  selector: 'imp-section',
  templateUrl: './imp-section.component.html',
  styleUrls: ['./imp-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ImperiaIconButtonComponent],
})
export class ImpSectionComponent {
  //#region VIEWCHILDS
  @ViewChild('content') public set content(v: ElementRef<HTMLDivElement>) {
    if (v) {
      this.contentWrapperHeight.next(v.nativeElement.offsetHeight + 50);
      const resizeObserver = new ResizeObserver(([entry]) => {
        this.zone.run(() =>
          this.contentWrapperHeight.next(entry.contentRect.height + 50)
        );
      });
      resizeObserver.observe(v.nativeElement);
    }
  }
  @ViewChild('contentWrapper') public set contentWrapper(
    v: ElementRef<HTMLDivElement>
  ) {
    if (v) {
      setTimeout(() =>
        this.renderer.addClass(v.nativeElement, 'enable-transition')
      );
    }
  }
  //#endregion VIEWCHILDS

  //#region INPUTS
  @Input() expandable: boolean = true;
  @Input() title: string | null = '';
  @Input() key: string = '';
  @Input() showMoreButton: boolean = false;
  @Input() top: number = 0;
  @Input('expanded') set expandedSetter(v: boolean) {
    this.expanded.next(v);
  }
  //#endregion INPUTS

  //#region OUTPUTS
  @Output('onExpand') onExpandEmitter: EventEmitter<{
    title: string;
    expanded: boolean;
  }> = new EventEmitter<{ title: string; expanded: boolean }>();
  @Output('onCollapse') onCollapseEmitter: EventEmitter<{
    title: string;
    expanded: boolean;
  }> = new EventEmitter<{ title: string; expanded: boolean }>();
  //#endregion OUTPUTS

  //#region PUBLIC VARIABLES
  public expanded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    true
  );
  public showingMore: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  public contentWrapperHeight: BehaviorSubject<number | null> =
    new BehaviorSubject<number | null>(null);
  //#endregion PUBLIC VARIABLES

  //#region PRIVATE VARIABLES
  private expanded$ = this.expanded.pipe(
    tap((value) => {
      if (value) {
        if (this.key) {
          localStorage.setItem(`${this.key}_${SECTION_EXPANDED_KEY}`, '1');
        }
        this.onExpandEmitter.emit({ title: this.title ?? '', expanded: value });
      } else {
        if (this.key) {
          localStorage.setItem(`${this.key}_${SECTION_EXPANDED_KEY}`, '0');
        }
        this.onCollapseEmitter.emit({
          title: this.title ?? '',
          expanded: value,
        });
      }
    })
  );
  private contentWrapperHeight$ = this.contentWrapperHeight.asObservable();
  //#endregion PRIVATE VARIABLES

  vm$: Observable<ViewModel> = of({}).pipe(
    combineLatestWith(this.expanded$, this.contentWrapperHeight$),
    map(([_, expanded, contentWrapperHeight]) => ({
      expanded,
      contentWrapperHeight,
    }))
  );

  constructor(private zone: NgZone, private renderer: Renderer2) {}
}
