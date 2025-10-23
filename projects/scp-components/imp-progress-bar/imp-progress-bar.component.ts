import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs';

@Component({
  selector: 'imp-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imp-progress-bar.component.html',
  styleUrls: ['./imp-progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpProgressBarComponent {
  @Input('label') label: string | null = null;

  @Input('current') set currentSetter(v: number | null) {
    if (!v) return;
    this.current.next(v);
  }
  private current = new BehaviorSubject<number>(0);

  @Input('total') set totalSetter(v: number | null) {
    if (!v) return;
    this.total.next(v);
  }
  private total = new BehaviorSubject<number>(100);

  public progress$ = combineLatest([
    this.current.pipe(map((v) => Math.max(0, v))),
    this.total.pipe(map((v) => Math.max(0, v))),
  ]).pipe(
    map(([current, total]) => (current / total) * 100),
    map((v) => Math.min(100, Math.max(0, v))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}
