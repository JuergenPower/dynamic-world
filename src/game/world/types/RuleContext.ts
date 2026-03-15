import { CellState } from '../CellState';

export type RuleContext = {
    row: number;
    column: number;
    currentState: CellState;
    getNumberOfGrassNeighbors: () => number;
};