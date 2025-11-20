import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('PrivacyPolicyComponent', () => {
    let component: PrivacyPolicyComponent;
    let fixture: ComponentFixture<PrivacyPolicyComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PrivacyPolicyComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PrivacyPolicyComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should open modal', () => {
        component.open();
        expect(component.isVisible()).toBe(true);
    });

    it('should close modal', () => {
        component.open();
        component.close();
        expect(component.isVisible()).toBe(false);
    });

    it('should emit closeModal event when closed', () => {
        spyOn(component.closeModal, 'emit');
        component.close();
        expect(component.closeModal.emit).toHaveBeenCalled();
    });
});

