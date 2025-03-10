import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudHistoryComponent } from './stud-history.component';

describe('StudHistoryComponent', () => {
  let component: StudHistoryComponent;
  let fixture: ComponentFixture<StudHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
