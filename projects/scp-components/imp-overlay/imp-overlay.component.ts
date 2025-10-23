import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  Input,
  TemplateRef,
} from '@angular/core';
import { FADEIN_FADEOUT } from '@imperiascm/scp-utils/animations';
import { TemplateContext } from './models/overlay.model';

@Component({
  selector: 'imp-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imp-overlay.component.html',
  styleUrls: ['./imp-overlay.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [FADEIN_FADEOUT],
})
export class ImpOverlayComponent {
  @HostBinding('@fadeInFadeOut')
  //#region INPUTS
  @Input()
  template!: TemplateRef<any>;
  @Input() templateCtx: TemplateContext = {};
  @Input() position: any = {};
  //#endregion INPUTS
}
