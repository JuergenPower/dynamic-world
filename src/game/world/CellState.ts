export enum CellState
{
    Dry = 0,
    Moist = 1,
    Grass = 2
}

export const ALL_CELL_STATES: CellState[] = [
    CellState.Dry,
    CellState.Moist,
    CellState.Grass
];

export const getCellStateLabel = (state: CellState) => {
    if (state === CellState.Dry) {
        return 'Dry Soil';
    }

    if (state === CellState.Moist) {
        return 'Moist Soil';
    }

    return 'Grass';
};