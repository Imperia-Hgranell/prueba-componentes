import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  Renderer2,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { ImpSectionComponent } from '../../components/imp-section/imp-section.component';

@Directive({
  selector: '[imp-section-item]',
  standalone: false,
})
export class ImpSectionItemDirective implements AfterViewInit, OnDestroy {
  @Input() isShowMore: boolean = false;
  private sectionSubscriptions: Subscription[] = [];
  @Input() visible: boolean = true;
  @Output() visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private renderer: Renderer2,
    private section: ImpSectionComponent,
    private elementRef: ElementRef
  ) {}

  ngAfterViewInit(): void {
    this.renderer.addClass(this.elementRef.nativeElement, 'imp-section-item');
    this.sectionSubscriptions.push(
      this.section.showingMore.subscribe((showingMore) => {
        if (showingMore && this.isShowMore && !this.visible) {
          this.show();
        } else if (!showingMore && this.isShowMore) {
          this.hide();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.sectionSubscriptions.forEach((sub) => sub.unsubscribe());
  }

  private show(): void {
    this.visible = true;
    this.visibleChange.emit(this.visible);
    this.renderer.removeClass(this.elementRef.nativeElement, 'hidden');
    setTimeout(() => {
      this.renderer.removeClass(
        this.elementRef.nativeElement,
        'visuallyhidden'
      );
    }, 50);
  }

  private hide(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
    this.renderer.addClass(this.elementRef.nativeElement, 'visuallyhidden');
    setTimeout(() => {
      this.renderer.addClass(this.elementRef.nativeElement, 'hidden');
    }, 300);
  }
}
