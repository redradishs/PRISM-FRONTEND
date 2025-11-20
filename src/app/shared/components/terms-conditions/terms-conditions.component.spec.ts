import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TermsConditionsComponent } from './terms-conditions.component';

describe('TermsConditionsComponent', () => {
    let component: TermsConditionsComponent;
    let fixture: ComponentFixture<TermsConditionsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TermsConditionsComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(TermsConditionsComponent);
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

