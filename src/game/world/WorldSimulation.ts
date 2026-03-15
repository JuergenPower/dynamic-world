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

    public isWithinBounds (row: number, column: number)
    {
        return row >= 0 && row < this.height && column >= 0 && column < this.width;
    }

    public getCellState (row: number, column: number)
    {
        return this.currentWorldState[row][column];
    }

    public setCellState (row: number, column: number, state: CellState)
    {
        if (!this.isWithinBounds(row, column)) {
            return;
        }

        this.currentWorldState[row][column] = state;
        this.nextWorldState[row][column] = state;
    }

    public applyIntent (row: number, column: number, intent: CellIntent)
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

    public step ()
    {
        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                this.nextWorldState[row][column] = this.evaluateCell(row, column, 'simulation');
            }
        }

        [this.currentWorldState, this.nextWorldState] = [this.nextWorldState, this.currentWorldState];
    }

    private createEmptyWorldState ()
    {
        return Array.from({ length: this.height }, () => Array(this.width).fill(CellState.Dry));
    }

    private evaluateCell (row: number, column: number, source: RuleSource)
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
            }
        };
    }

    private countNeighborsOfState (row: number, column: number, state: CellState, includeDiagonals: boolean)
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

    private createRulesIndex (rules: TransitionRule[])
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

    private createRuleIndexKey (source: RuleSource, state: CellState)
    {
        return `${source}:${state}`;
    }
}