import { CellState } from './CellState';
import { TransitionRule } from './types';

const GRASS_GROWTH_CHANCE_PER_GRASS_NEIGHBOR = 0.025;
const WATER_MOISTEN_MAX_DISTANCE = 4;
const WATER_MOISTEN_MAX_CHANCE = 0.1;

export const defaultTransitionRules: TransitionRule[] = [
    {
        from: CellState.Dry,
        to: CellState.Moist,
        source: 'simulation',
        priority: 55,
        condition: (context) => context.hasStateWithinDistance(CellState.Water, WATER_MOISTEN_MAX_DISTANCE),
        chance: (context) => {
            const distanceToWater = context.getDistanceToNearestState(CellState.Water, WATER_MOISTEN_MAX_DISTANCE);
            if (distanceToWater === undefined) {
                return 0;
            }

            const distanceFactor = (WATER_MOISTEN_MAX_DISTANCE - distanceToWater + 1) / WATER_MOISTEN_MAX_DISTANCE;
            return WATER_MOISTEN_MAX_CHANCE * distanceFactor;
        }
    },
    {
        from: CellState.Riverbed,
        to: CellState.Water,
        source: 'simulation',
        priority: 60,
        condition: (context) => context.getNumberOfWaterNeighbors() > 0,
        chance: () => 1
    },
    {
        from: CellState.Moist,
        to: CellState.Grass,
        source: 'simulation',
        priority: 50,
        condition: (context) => context.getNumberOfGrassNeighbors() > 0,
        chance: (context) => GRASS_GROWTH_CHANCE_PER_GRASS_NEIGHBOR * context.getNumberOfGrassNeighbors()
    }
];