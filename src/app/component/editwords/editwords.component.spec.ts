import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditwordsComponent } from './editwords.component';

describe('EditwordsComponent', () => {
  let component: EditwordsComponent;
  let fixture: ComponentFixture<EditwordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditwordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditwordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
