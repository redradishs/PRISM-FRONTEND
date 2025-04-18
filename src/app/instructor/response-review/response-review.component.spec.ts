import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseReviewComponent } from './response-review.component';

describe('ResponseReviewComponent', () => {
  let component: ResponseReviewComponent;
  let fixture: ComponentFixture<ResponseReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponseReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResponseReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
