import { AnimationBuilder, AnimationMetadata } from '@angular/animations';
import {
  ContentChild,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  Renderer2,
} from '@angular/core';
import {
  FADEIN_DEFAULT_PARAMS,
  FADEIN_METADATA,
  FADEOUT_DEFAULT_PARAMS,
  FADEOUT_METADATA,
  FadeParams,
} from '@imperiascm/scp-utils/animations';
import { ImpTranslateService } from '@imperiascm/translate';

@Directive({
  selector: '[imp-loading-blocker-msg-element]',
  host: { class: 'imp-loading-blocker-message' },
  standalone: true,
})
export class ImpLoadingBlockerMsgDirective {
  constructor(element: ElementRef<HTMLElement>) {
    element.nativeElement.remove();
  }
}

@Directive({
  selector: '[imp-loading-blocker]',
  standalone: true,
})
export class ImpLoadingBlockerDirective implements OnDestroy {
  @Input('imp-loading-blocker') set loadingSetter(
    v: boolean | null | undefined
  ) {
    if (!!v) {
      this.block();
    } else {
      this.unblock();
    }
  }
  @Input('imp-loading-blocker-msg') loadingMessage: string | null | undefined;
  @Input('imp-loading-blocker-animation-duration') animationDuration:
    | string
    | undefined;
  @Input('imp-loading-blocker-animation-timing-function')
  animationTimingFunction: string | undefined;

  @ContentChild(ImpLoadingBlockerMsgDirective, { read: ElementRef })
  loadingMessageElement: ElementRef<Element> | undefined;

  private _elementOriginalPosition: string | null = null;

  constructor(
    private element: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private animationBuilder: AnimationBuilder,
    private typedTranslateService: ImpTranslateService
  ) {}

  ngOnDestroy(): void {
    this.unblock();
  }

  public block() {
    this.saveOriginalPosition();
    this.element.nativeElement.style.position = 'relative';
    const blocker = this.createBlocker();
    this.renderer.appendChild(this.element.nativeElement, blocker);
    this.createAnimationPlayer(
      blocker,
      FADEIN_METADATA,
      FADEIN_DEFAULT_PARAMS
    ).play();
  }

  public unblock() {
    this.removeBlocker();
    this.restoreOriginalPosition();
  }

  private saveOriginalPosition() {
    this._elementOriginalPosition = this.element.nativeElement.style.position;
  }

  private restoreOriginalPosition() {
    if (this._elementOriginalPosition) {
      this.element.nativeElement.style.position = this._elementOriginalPosition;
    }
  }

  private createBlocker() {
    const blocker = this.renderer.createElement('div');
    this.renderer.addClass(blocker, 'imp-loading-blocker');
    this.renderer.setStyle(blocker, 'position', 'absolute');
    this.renderer.setStyle(blocker, 'top', '0');
    this.renderer.setStyle(blocker, 'left', '0');
    this.renderer.setStyle(blocker, 'width', '100%');
    this.renderer.setStyle(blocker, 'height', '100%');
    this.renderer.setStyle(blocker, 'animation', 'fade-in 250ms ease-in-out');
    this.renderer.setStyle(
      blocker,
      'background-color',
      'rgba(255, 255, 255, 0.5)'
    );
    this.renderer.setStyle(blocker, 'z-index', '9999');
    this.renderer.setStyle(blocker, 'display', 'flex');
    this.renderer.setStyle(blocker, 'justify-content', 'center');
    this.renderer.setStyle(blocker, 'align-items', 'center');
    this.renderer.listen(blocker, 'click', (event) => {
      event.stopPropagation();
      event.preventDefault();
    });
    if (this.loadingMessageElement) {
      this.renderer.appendChild(
        blocker,
        this.loadingMessageElement.nativeElement
      );
    } else {
      const msg = this.renderer.createElement('span');
      this.renderer.addClass(msg, 'imp-loading-blocker-message');
      this.renderer.setStyle(msg, 'font-size', '1.5rem');
      this.renderer.setStyle(msg, 'color', '#505c6d');
      this.renderer.setStyle(msg, 'font-weight', 'bold');
      this.renderer.setProperty(
        msg,
        'innerText',
        this.loadingMessage ??
          this.typedTranslateService.translation.IMP_LOADING_BLOCKER.loading
      );
      this.renderer.appendChild(blocker, msg);
    }

    return blocker;
  }

  private removeBlocker() {
    const blocker = this.element.nativeElement.querySelector(
      '.imp-loading-blocker'
    );
    if (blocker) {
      const animationPlayer = this.createAnimationPlayer(
        blocker,
        FADEOUT_METADATA,
        FADEOUT_DEFAULT_PARAMS
      );
      animationPlayer.play();
      animationPlayer.onDone(() =>
        this.renderer.removeChild(this.element.nativeElement, blocker)
      );
    }
  }

  private createAnimationPlayer(
    element: Element,
    metadata: AnimationMetadata | AnimationMetadata[],
    params: FadeParams
  ) {
    const { duration, timingFunction } = params;
    const {
      animationDuration = duration,
      animationTimingFunction = timingFunction,
    } = this;
    return this.animationBuilder.build(metadata).create(element, {
      params: {
        duration: animationDuration,
        timingFunction: animationTimingFunction,
      },
    });
  }
}
