import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinalGenerateAssessmentComponent } from './final-generate-assessment.component';

describe('FinalGenerateAssessmentComponent', () => {
  let component: FinalGenerateAssessmentComponent;
  let fixture: ComponentFixture<FinalGenerateAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinalGenerateAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinalGenerateAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
