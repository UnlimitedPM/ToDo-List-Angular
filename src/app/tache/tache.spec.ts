import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Tache } from './tache';

describe('Tache', () => {
  let component: Tache;
  let fixture: ComponentFixture<Tache>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tache]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Tache);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
