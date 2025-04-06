import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxJsonTreeviewComponent } from './ngx-json-treeview.component';

describe('NgxJsonTreeviewComponent', () => {
  let component: NgxJsonTreeviewComponent;
  let fixture: ComponentFixture<NgxJsonTreeviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxJsonTreeviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxJsonTreeviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
