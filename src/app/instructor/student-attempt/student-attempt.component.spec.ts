import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAttemptComponent } from './student-attempt.component';

describe('StudentAttemptComponent', () => {
  let component: StudentAttemptComponent;
  let fixture: ComponentFixture<StudentAttemptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentAttemptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentAttemptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
