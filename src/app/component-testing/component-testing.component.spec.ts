import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentTestingComponent } from './component-testing.component';

describe('ComponentTestingComponent', () => {
  let component: ComponentTestingComponent;
  let fixture: ComponentFixture<ComponentTestingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentTestingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComponentTestingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
