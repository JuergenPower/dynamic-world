import { CellState } from '../CellState';

export type SetCellStateIntent = {
    type: 'set-cell-state';
    targetState: CellState;
};

export type CellIntent = SetCellStateIntent;