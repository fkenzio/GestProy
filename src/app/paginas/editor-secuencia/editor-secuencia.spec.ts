import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorSecuencia } from './editor-secuencia';

describe('EditorSecuencia', () => {
  let component: EditorSecuencia;
  let fixture: ComponentFixture<EditorSecuencia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorSecuencia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorSecuencia);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
