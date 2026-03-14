import { Scene } from 'phaser';
import { CellState } from '../world/CellState';
import { WorldSimulation } from '../world/WorldSimulation';

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

    constructor ()
    {
        super('Game');
    }

    create ()
    {
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

    private initializeWorld ()
    {
        this.world = new WorldSimulation(40, 30);
        this.world.setCellState(14, 19, CellState.Grass);

        this.renderWorld();
    }

    private stepWorld ()
    {
        this.world.step();
        this.renderWorld();
    }

    private renderWorld ()
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

    private handlePointerDown (pointer: Phaser.Input.Pointer)
    {
        const column = Math.floor(pointer.x / CELL_SIZE);
        const row = Math.floor(pointer.y / CELL_SIZE);

        if (!this.world.isWithinBounds(row, column)) {
            return;
        }

        const changed = this.world.applyIntent(row, column, { type: 'water-cell' });
        if (changed) {
            this.renderWorld();
        }
    }

    private handleShutdown ()
    {
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.stepTimer?.remove(false);
    }
}
