import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-rolling-number',
    standalone: true,
    imports: [CommonModule],
    template: `<span class="rolling-number">{{ displayValue }}</span>`,
    styles: [`
    .rolling-number {
      font-variant-numeric: tabular-nums;
      display: inline-block;
      min-width: 1ch;
      font-weight: inherit;
      color: inherit;
    }
  `]
})
export class RollingNumberComponent implements OnInit, OnChanges, OnDestroy {
    @Input() value: number = 0;
    @Input() duration: number = 2000;
    @Input() decimals: number = 0;
    @Input() prefix: string = '';
    @Input() suffix: string = '';

    displayValue: string = '0';
    private animationFrame?: number;
    private currentValue: number = 0;

    ngOnInit() {
        this.animateValue(0, this.value);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['value'] && !changes['value'].firstChange) {
            this.animateValue(this.currentValue, this.value);
        }
    }

    ngOnDestroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    private animateValue(startValue: number, endValue: number) {
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.duration, 1);

            // Easing function (ease-out cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (endValue - startValue) * easeOut;

            this.currentValue = current;

            const formattedValue = current.toLocaleString(undefined, {
                minimumFractionDigits: this.decimals,
                maximumFractionDigits: this.decimals
            });

            this.displayValue = this.prefix + formattedValue + this.suffix;


            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.currentValue = endValue;
                this.displayValue = this.prefix + formattedValue + this.suffix;
            }
        };

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.animationFrame = requestAnimationFrame(animate);
    }
}
