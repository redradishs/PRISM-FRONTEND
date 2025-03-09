import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudClassesComponent } from './stud-classes.component';

describe('StudClassesComponent', () => {
  let component: StudClassesComponent;
  let fixture: ComponentFixture<StudClassesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudClassesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudClassesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
