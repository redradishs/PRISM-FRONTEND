import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudTakeexamsecureComponent } from './stud-takeexamsecure.component';

describe('StudTakeexamsecureComponent', () => {
  let component: StudTakeexamsecureComponent;
  let fixture: ComponentFixture<StudTakeexamsecureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudTakeexamsecureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudTakeexamsecureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
