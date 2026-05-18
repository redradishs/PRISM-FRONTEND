import { Component, HostBinding, Input } from '@angular/core';

@Component({
    selector: 'app-auth-branding',
    standalone: true,
    templateUrl: './auth-branding.component.html',
    styleUrl: './auth-branding.component.css'
})
export class AuthBrandingComponent {
    @Input() disableAnimations = false;

    @HostBinding('class.no-anim')
    get noAnim(): boolean {
        return this.disableAnimations;
    }
}
