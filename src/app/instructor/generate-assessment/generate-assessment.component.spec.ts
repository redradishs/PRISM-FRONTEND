import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateAssessmentComponent } from './generate-assessment.component';

describe('GenerateAssessmentComponent', () => {
  let component: GenerateAssessmentComponent;
  let fixture: ComponentFixture<GenerateAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenerateAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
