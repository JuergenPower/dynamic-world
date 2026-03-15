import { Scene } from 'phaser';
import { ALL_CELL_STATES, CellState, getCellStateLabel } from '../world/CellState';
import { WorldSimulation } from '../world/WorldSimulation';
import { CellIntent } from '../world/types';
import { CellContextMenu, CellContextMenuAction } from '../ui/CellContextMenu';

const CELL_SIZE = 24;
const STEP_DELAY = 5000;
const DRY_SOIL_COLOR = 0xd6b34b;
const MOIST_SOIL_COLOR = 0x7a6140;
const GRASS_COLOR = 0x1eb045;

export class Game extends Scene
{
    private world!: WorldSimulation;
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private stepTimer?: Phaser.Time.TimerEvent;
    private cellContextMenu!: CellContextMenu;
    private suppressNextPointerDown = false;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.input.mouse?.disableContextMenu();
        this.gridGraphics = this.add.graphics();
        this.cellContextMenu = new CellContextMenu(this);
        this.initializeWorld();
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.events.once('shutdown', this.handleShutdown, this);

        this.stepTimer = this.time.addEvent({
            delay: STEP_DELAY,
            loop: true,
            callback: this.stepWorld,
            callbackScope: this
        });

    }

    private initializeWorld (): void
    {
        this.world = new WorldSimulation(40, 30);
        this.renderWorld();
    }

    private stepWorld (): void
    {
        this.world.step();
        this.renderWorld();
    }

    private renderWorld (): void
    {
        this.gridGraphics.clear();

        for (let row = 0; row < this.world.height; row++) {
            for (let column = 0; column < this.world.width; column++) {
                const cellState = this.world.getCellState(row, column);
                let cellColor = DRY_SOIL_COLOR;

                if (cellState === CellState.Moist) {
                    cellColor = MOIST_SOIL_COLOR;
                } else if (cellState === CellState.Grass) {
                    cellColor = GRASS_COLOR;
                }
                this.gridGraphics.fillStyle(cellColor, 1);
                this.gridGraphics.fillRect(column * CELL_SIZE, row * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            }
        }
    }

    private handlePointerDown (pointer: Phaser.Input.Pointer): void
    {
        if (this.suppressNextPointerDown) {
            this.suppressNextPointerDown = false;
            return; // Suppress pointer down event after selecting a context menu action
        }

        if (pointer.button !== 0) {
            return; // Only respond to left-clicks
        }

        if (this.cellContextMenu.containsPoint(pointer.x, pointer.y)) {
            return; // Clicked inside the context menu, do nothing (handled by menu)
        }

        if (this.cellContextMenu.isOpen) {
            this.cellContextMenu.close();
            return;
        }

        const selectedCell = this.getCellAtPointer(pointer);

        if (!selectedCell) {
            this.cellContextMenu.close();
            return;
        }

        this.openContextMenu(selectedCell.row, selectedCell.column, pointer.x, pointer.y);
    }

    private getCellAtPointer (pointer: Phaser.Input.Pointer): { row: number; column: number } | undefined
    {
        const column = Math.floor(pointer.x / CELL_SIZE);
        const row = Math.floor(pointer.y / CELL_SIZE);

        if (!this.world.isWithinBounds(row, column)) {
            return undefined;
        }

        return { row, column };
    }

    private getContextMenuActions (row: number, column: number): CellContextMenuAction[]
    {
        return ALL_CELL_STATES.map((state) => ({
            label: `Set to ${getCellStateLabel(state)}`,
            onSelect: () => {
                const intent: CellIntent = {
                    type: 'set-cell-state',
                    targetState: state
                };

                const changed = this.world.applyIntent(row, column, intent);
                if (changed) {
                    this.renderWorld();
                }

                this.suppressNextPointerDown = true;
                this.cellContextMenu.close();
            }
        }));
    }

    private openContextMenu (row: number, column: number, pointerX: number, pointerY: number): void
    {
        this.cellContextMenu.open(pointerX, pointerY, this.getContextMenuActions(row, column));
    }

    private handleShutdown (): void
    {
        this.cellContextMenu.destroy();
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.stepTimer?.remove(false);
    }
}
