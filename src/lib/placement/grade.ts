/**
 * Placement banding — maps an aptitude-test score to a recommended placement.
 * Pure so it can be unit-tested and reused on either side of the wire.
 */

export interface Placement {
  level: string;
  notes: string;
}

export function placementFor(percentage: number): Placement {
  if (percentage >= 85) {
    return {
      level: 'Advanced',
      notes: 'Strong grasp of the material — ready to work at a higher level or accelerate.',
    };
  }
  if (percentage >= 65) {
    return {
      level: 'On level',
      notes: 'Solid foundation — place at the expected level and build on it.',
    };
  }
  if (percentage >= 45) {
    return {
      level: 'Developing',
      notes: 'Some gaps to close — place at level with targeted support on weak areas.',
    };
  }
  return {
    level: 'Foundational',
    notes: 'Begin with the fundamentals to build confidence before moving up.',
  };
}
