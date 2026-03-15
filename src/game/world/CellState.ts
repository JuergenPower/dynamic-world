export enum CellState
{
    Dry = 0,
    Moist = 1,
    Grass = 2,
    Riverbed = 3,
    Water = 4
}

export const ALL_CELL_STATES: CellState[] = [
    CellState.Dry,
    CellState.Moist,
    CellState.Grass,
    CellState.Riverbed,
    CellState.Water
];

export const getCellStateLabel = (state: CellState) => {
    if (state === CellState.Dry) {
        return 'Dry Soil';
    }

    if (state === CellState.Moist) {
        return 'Moist Soil';
    }

    if (state === CellState.Riverbed) {
        return 'Riverbed';
    }

    if (state === CellState.Water) {
        return 'Water';
    }

    return 'Grass';
};