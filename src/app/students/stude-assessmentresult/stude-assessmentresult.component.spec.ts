import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudeAssessmentresultComponent } from './stude-assessmentresult.component';

describe('StudeAssessmentresultComponent', () => {
  let component: StudeAssessmentresultComponent;
  let fixture: ComponentFixture<StudeAssessmentresultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudeAssessmentresultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudeAssessmentresultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
