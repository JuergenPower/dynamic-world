import { Scene } from 'phaser';
import { ALL_CELL_STATES, CellState, getCellStateLabel } from '../world/CellState';
import { WorldSimulation } from '../world/WorldSimulation';
import { CellIntent } from '../world/types';

const CELL_SIZE = 24;
const STEP_DELAY = 5000;
const DRY_SOIL_COLOR = 0xd6b34b;
const MOIST_SOIL_COLOR = 0x7a6140;
const GRASS_COLOR = 0x1eb045;
const CONTEXT_MENU_BG_COLOR = 0x232323;
const CONTEXT_MENU_BORDER_COLOR = 0x505050;

type ContextMenuAction = {
    label: string;
    intent: CellIntent;
};

export class Game extends Scene
{
    private world!: WorldSimulation;
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private stepTimer?: Phaser.Time.TimerEvent;
    private contextMenu?: Phaser.GameObjects.Container;
    private contextMenuBounds?: Phaser.Geom.Rectangle;
    private suppressNextPointerDown = false;

    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.input.mouse?.disableContextMenu();

        this.gridGraphics = this.add.graphics();

        this.initializeWorld();

        this.input.on('pointerdown', this.handlePointerDown, this);

        this.stepTimer = this.time.addEvent({
            delay: STEP_DELAY,
            loop: true,
            callback: this.stepWorld,
            callbackScope: this
        });

        this.events.once('shutdown', this.handleShutdown, this);
    }

    private initializeWorld (): void
    {
        this.world = new WorldSimulation(40, 30);
        this.world.setCellState(14, 19, CellState.Grass);

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
            return;
        }

        if (pointer.button !== 0) {
            return;
        }

        if (this.contextMenuBounds && this.contextMenuBounds.contains(pointer.x, pointer.y)) {
            return;
        }

        if (this.contextMenuBounds && !this.contextMenuBounds.contains(pointer.x, pointer.y)) {
            this.closeContextMenu();
            return;
        }

        const selectedCell = this.getCellAtPointer(pointer);

        if (!selectedCell) {
            this.closeContextMenu();
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

    private getContextMenuActions (): ContextMenuAction[]
    {
        return ALL_CELL_STATES.map((state) => ({
            label: `Set to ${getCellStateLabel(state)}`,
            intent: {
                type: 'set-cell-state',
                targetState: state
            }
        }));
    }

    private openContextMenu (row: number, column: number, pointerX: number, pointerY: number): void
    {
        this.closeContextMenu();

        const actions = this.getContextMenuActions();
        const menuWidth = 180;
        const itemHeight = 28;
        const padding = 6;
        const menuHeight = padding * 2 + itemHeight * actions.length;

        const menuX = Phaser.Math.Clamp(pointerX, 0, this.scale.width - menuWidth);
        const menuY = Phaser.Math.Clamp(pointerY, 0, this.scale.height - menuHeight);

        const background = this.add.rectangle(menuX, menuY, menuWidth, menuHeight, CONTEXT_MENU_BG_COLOR, 0.95)
            .setOrigin(0)
            .setStrokeStyle(1, CONTEXT_MENU_BORDER_COLOR);

        const menuObjects: Phaser.GameObjects.GameObject[] = [background];

        actions.forEach((action, index) => {
            const itemY = menuY + padding + index * itemHeight;

            const hitArea = this.add.rectangle(menuX + 1, itemY, menuWidth - 2, itemHeight, 0xffffff, 0.001)
                .setOrigin(0)
                .setInteractive({ useHandCursor: true });

            const label = this.add.text(menuX + 10, itemY + 6, action.label, {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: '#ffffff'
            });

            hitArea.on('pointerdown', () => {
                const changed = this.world.applyIntent(row, column, action.intent);
                if (changed) {
                    this.renderWorld();
                }

                this.suppressNextPointerDown = true;
                this.closeContextMenu();
            });

            menuObjects.push(hitArea, label);
        });

        this.contextMenu = this.add.container(0, 0, menuObjects).setDepth(50);
        this.contextMenuBounds = new Phaser.Geom.Rectangle(menuX, menuY, menuWidth, menuHeight);
    }

    private closeContextMenu (): void
    {
        this.contextMenu?.destroy(true);
        this.contextMenu = undefined;
        this.contextMenuBounds = undefined;
    }

    private handleShutdown (): void
    {
        this.closeContextMenu();
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.stepTimer?.remove(false);
    }
}
