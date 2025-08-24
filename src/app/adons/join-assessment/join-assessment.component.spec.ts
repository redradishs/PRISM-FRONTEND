import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinAssessmentComponent } from './join-assessment.component';

describe('JoinAssessmentComponent', () => {
  let component: JoinAssessmentComponent;
  let fixture: ComponentFixture<JoinAssessmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinAssessmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JoinAssessmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
