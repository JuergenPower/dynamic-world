import { CellState } from '../CellState';
import { CellIntent } from './CellIntent';

export type RuleContext = {
    row: number;
    column: number;
    currentState: CellState;
    intent?: CellIntent;
    getNumberOfGrassNeighbors: () => number;
};