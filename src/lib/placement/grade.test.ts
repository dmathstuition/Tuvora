import { describe, it, expect } from 'vitest';
import { placementFor } from './grade';

describe('placementFor', () => {
  it('bands a top score as Advanced', () => {
    expect(placementFor(100).level).toBe('Advanced');
    expect(placementFor(85).level).toBe('Advanced');
  });

  it('bands a solid score as On level', () => {
    expect(placementFor(84).level).toBe('On level');
    expect(placementFor(65).level).toBe('On level');
  });

  it('bands a middling score as Developing', () => {
    expect(placementFor(64).level).toBe('Developing');
    expect(placementFor(45).level).toBe('Developing');
  });

  it('bands a low score as Foundational', () => {
    expect(placementFor(44).level).toBe('Foundational');
    expect(placementFor(0).level).toBe('Foundational');
  });

  it('always returns notes', () => {
    for (const pct of [0, 44, 45, 64, 65, 84, 85, 100]) {
      expect(placementFor(pct).notes.length).toBeGreaterThan(0);
    }
  });
});
