import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudTakeexamComponent } from './stud-takeexam.component';

describe('StudTakeexamComponent', () => {
  let component: StudTakeexamComponent;
  let fixture: ComponentFixture<StudTakeexamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudTakeexamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudTakeexamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
