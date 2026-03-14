import { CellState } from '../CellState';
import { RuleContext } from './RuleContext';
import { RuleSource } from './RuleSource';

export type TransitionRule = {
    from: CellState;
    to: CellState;
    source: RuleSource;
    priority: number;
    condition: (context: RuleContext) => boolean;
    chance: (context: RuleContext) => number;
};