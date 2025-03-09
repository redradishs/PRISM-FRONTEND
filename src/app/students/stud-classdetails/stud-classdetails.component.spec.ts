import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudClassdetailsComponent } from './stud-classdetails.component';

describe('StudClassdetailsComponent', () => {
  let component: StudClassdetailsComponent;
  let fixture: ComponentFixture<StudClassdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudClassdetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudClassdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
