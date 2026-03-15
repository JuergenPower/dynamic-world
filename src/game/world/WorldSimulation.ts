import { CellState } from './CellState';
import { defaultTransitionRules } from './defaultTransitionRules';
import { CellIntent, RuleContext, RuleSource, TransitionRule } from './types';

export class WorldSimulation
{
    private currentWorldState: CellState[][];
    private nextWorldState: CellState[][];
    private rulesIndex: Map<string, TransitionRule[]>;

    constructor (
        public readonly width: number,
        public readonly height: number,
        rules: TransitionRule[] = defaultTransitionRules
    )
    {
        this.currentWorldState = this.createEmptyWorldState();
        this.nextWorldState = this.createEmptyWorldState();
        this.rulesIndex = this.createRulesIndex(rules);
    }

    public isWithinBounds (row: number, column: number): boolean
    {
        return row >= 0 && row < this.height && column >= 0 && column < this.width;
    }

    public getCellState (row: number, column: number): CellState
    {
        return this.currentWorldState[row][column];
    }

    public setCellState (row: number, column: number, state: CellState): void
    {
        if (!this.isWithinBounds(row, column)) {
            return;
        }

        this.currentWorldState[row][column] = state;
        this.nextWorldState[row][column] = state;
    }

    public applyIntent (row: number, column: number, intent: CellIntent): boolean
    {
        if (!this.isWithinBounds(row, column)) {
            return false;
        }

        if (this.currentWorldState[row][column] === intent.targetState) {
            return false;
        }

        this.currentWorldState[row][column] = intent.targetState;
        this.nextWorldState[row][column] = intent.targetState;

        return true;
    }

    public step (): void
    {
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                this.nextWorldState[row][column] = this.evaluateCell(row, column, 'simulation');
            }
        }

        [this.currentWorldState, this.nextWorldState] = [this.nextWorldState, this.currentWorldState];
    }

    private createEmptyWorldState (): CellState[][]
    {
        return Array.from({ length: this.height }, () => Array(this.width).fill(CellState.Dry));
    }

    private evaluateCell (row: number, column: number, source: RuleSource): CellState
    {
        const currentState = this.currentWorldState[row][column];
        const candidateRules = this.rulesIndex.get(this.createRuleIndexKey(source, currentState));

        if (!candidateRules || candidateRules.length === 0) {
            return currentState;
        }

        const context = this.createRuleContext(row, column, currentState);

        for (const rule of candidateRules) {
            if (!rule.condition(context)) {
                continue;
            }

            const chance = Phaser.Math.Clamp(rule.chance(context), 0, 1);
            if (Math.random() < chance) {
                return rule.to;
            }
        }

        return currentState;
    }

    private createRuleContext (row: number, column: number, currentState: CellState): RuleContext
    {
        let grassNeighbors: number | undefined;
        let waterNeighbors: number | undefined;
        const nearestDistanceCache = new Map<string, number | undefined>();

        return {
            row,
            column,
            currentState,
            getNumberOfGrassNeighbors: () => {
                if (grassNeighbors === undefined) {
                    grassNeighbors = this.countNeighborsOfState(row, column, CellState.Grass, true);
                }
                return grassNeighbors;
            },
            getNumberOfWaterNeighbors: () => {
                if (waterNeighbors === undefined) {
                    waterNeighbors = this.countNeighborsOfState(row, column, CellState.Water, false);
                }
                return waterNeighbors;
            },
            hasStateWithinDistance: (state: CellState, maxDistance: number) => {
                return this.findNearestStateDistance(row, column, state, maxDistance, nearestDistanceCache) !== undefined;
            },
            getDistanceToNearestState: (state: CellState, maxDistance: number) => {
                return this.findNearestStateDistance(row, column, state, maxDistance, nearestDistanceCache);
            }
        };
    }

    private findNearestStateDistance (
        originRow: number,
        originColumn: number,
        state: CellState,
        maxDistance: number,
        cache: Map<string, number | undefined>
    ): number | undefined
    {
        const key = `${state}:${maxDistance}`;
        if (cache.has(key)) {
            return cache.get(key);
        }

        let nearestDistance: number | undefined;

        for (let rowOffset = -maxDistance; rowOffset <= maxDistance; rowOffset++) {
            for (let columnOffset = -maxDistance; columnOffset <= maxDistance; columnOffset++) {
                if (rowOffset === 0 && columnOffset === 0) {
                    continue;
                }

                const distance = Math.abs(rowOffset) + Math.abs(columnOffset);
                if (distance > maxDistance) {
                    continue;
                }

                const row = originRow + rowOffset;
                const column = originColumn + columnOffset;

                if (!this.isWithinBounds(row, column)) {
                    continue;
                }

                if (this.currentWorldState[row][column] !== state) {
                    continue;
                }

                if (nearestDistance === undefined || distance < nearestDistance) {
                    nearestDistance = distance;
                }
            }
        }

        cache.set(key, nearestDistance);

        return nearestDistance;
    }

    private countNeighborsOfState (row: number, column: number, state: CellState, includeDiagonals: boolean): number
    {
        let matchingNeighbors = 0;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
                if (rowOffset === 0 && columnOffset === 0) {
                    continue;
                }

                if (!includeDiagonals && rowOffset !== 0 && columnOffset !== 0) {
                    continue;
                }

                const neighborRow = row + rowOffset;
                const neighborColumn = column + columnOffset;

                if (!this.isWithinBounds(neighborRow, neighborColumn)) {
                    continue;
                }

                if (this.currentWorldState[neighborRow][neighborColumn] === state) {
                    matchingNeighbors++;
                }
            }
        }

        return matchingNeighbors;
    }

    private createRulesIndex (rules: TransitionRule[]): Map<string, TransitionRule[]>
    {
        const index = new Map<string, TransitionRule[]>();

        for (const rule of rules) {
            const key = this.createRuleIndexKey(rule.source, rule.from);
            const existingRules = index.get(key) ?? [];
            existingRules.push(rule);
            existingRules.sort((left, right) => right.priority - left.priority);
            index.set(key, existingRules);
        }

        return index;
    }

    private createRuleIndexKey (source: RuleSource, state: CellState): string
    {
        return `${source}:${state}`;
    }
}