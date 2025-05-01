import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MasteryResultComponent } from './mastery-result.component';

describe('MasteryResultComponent', () => {
  let component: MasteryResultComponent;
  let fixture: ComponentFixture<MasteryResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MasteryResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MasteryResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
