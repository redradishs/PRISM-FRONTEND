import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudConfirmationComponent } from './stud-confirmation.component';

describe('StudConfirmationComponent', () => {
  let component: StudConfirmationComponent;
  let fixture: ComponentFixture<StudConfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudConfirmationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
