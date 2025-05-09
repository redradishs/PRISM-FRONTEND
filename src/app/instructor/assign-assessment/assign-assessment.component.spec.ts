import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignAssessmentComponent } from './assign-assessment.component';

describe('AssignAssessmentComponent', () => {
  let component: AssignAssessmentComponent;
  let fixture: ComponentFixture<AssignAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
