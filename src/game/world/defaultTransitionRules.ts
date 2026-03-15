import { CellState } from './CellState';
import { TransitionRule } from './types';

const GRASS_GROWTH_CHANCE_PER_GRASS_NEIGHBOR = 0.025;

export const defaultTransitionRules: TransitionRule[] = [
    {
        from: CellState.Moist,
        to: CellState.Grass,
        source: 'simulation',
        priority: 50,
        condition: (context) => context.getNumberOfGrassNeighbors() > 0,
        chance: (context) => GRASS_GROWTH_CHANCE_PER_GRASS_NEIGHBOR * context.getNumberOfGrassNeighbors()
    }
];