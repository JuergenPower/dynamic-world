import { CellState } from '../CellState';

export type RuleContext = {
    row: number;
    column: number;
    currentState: CellState;
    getNumberOfGrassNeighbors: () => number;
    getNumberOfWaterNeighbors: () => number;
    hasStateWithinDistance: (state: CellState, maxDistance: number) => boolean;
    getDistanceToNearestState: (state: CellState, maxDistance: number) => number | undefined;
};