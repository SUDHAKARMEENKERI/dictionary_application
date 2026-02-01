import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QaImageGeneratorComponent } from './qa-image-generator.component';

describe('QaImageGeneratorComponent', () => {
  let component: QaImageGeneratorComponent;
  let fixture: ComponentFixture<QaImageGeneratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QaImageGeneratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QaImageGeneratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
