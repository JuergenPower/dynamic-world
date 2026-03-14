import { Scene } from 'phaser';

const CELL_SIZE = 24;
const STEP_DELAY = 5000;
const DRY_SOIL_COLOR = 0xd6b34b;
const MOIST_SOIL_COLOR = 0x7a6140;
const GRASS_COLOR = 0x1eb045;

const STATE_DRY = 0;
const STATE_MOIST = 1;
const STATE_GRASS = 2;

const GRASS_GROWTH_CHANCE_PER_GRASS_NEIGHBOR = 0.025;

export class Game extends Scene
{
    private currentWorldState: number[][] = [];
    private nextWorldState: number[][] = [];
    private gridGraphics!: Phaser.GameObjects.Graphics;
    private gridWidth = 0;
    private gridHeight = 0;
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
        this.gridWidth = 40;
        this.gridHeight = 30;

        this.currentWorldState = this.createEmptyWorldState();
        this.currentWorldState[14][19] = STATE_GRASS;
        this.nextWorldState = this.createEmptyWorldState();

        this.renderWorld();
    }

    private createEmptyWorldState ()
    {
        return Array.from({ length: this.gridHeight }, () => Array(this.gridWidth).fill(STATE_DRY));
    }

    private stepWorld ()
    {
        for (let row = 0; row < this.gridHeight; row++) {
            for (let column = 0; column < this.gridWidth; column++) {
                const currentCellState = this.currentWorldState[row][column];
                

                if (currentCellState === STATE_GRASS || currentCellState === STATE_DRY) {
                    this.nextWorldState[row][column] = currentCellState;
                    continue;
                }

                const grassNeighbors = this.countGrassNeighbors(row, column);
                const growthChance = GRASS_GROWTH_CHANCE_PER_GRASS_NEIGHBOR * grassNeighbors;
                this.nextWorldState[row][column] = growthChance >= Math.random() ? STATE_GRASS : STATE_MOIST;
            }
        }
        [this.currentWorldState, this.nextWorldState] = [this.nextWorldState, this.currentWorldState];
        this.renderWorld();
    }

    private countGrassNeighbors (row: number, column: number)
    {
        let grassNeighbors = 0;

        for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
            for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
                if (rowOffset === 0 && columnOffset === 0) {
                    continue;
                }

                const neighborRow = row + rowOffset;
                const neighborColumn = column + columnOffset;

                if (
                    neighborRow < 0 ||
                    neighborRow >= this.gridHeight ||
                    neighborColumn < 0 ||
                    neighborColumn >= this.gridWidth
                ) {
                    continue;
                }

                if (this.currentWorldState[neighborRow][neighborColumn] === STATE_GRASS) {
                    grassNeighbors++;
                }
            }
        }

        return grassNeighbors;
    }

    private renderWorld ()
    {
        this.gridGraphics.clear();

        for (let row = 0; row < this.gridHeight; row++) {
            for (let column = 0; column < this.gridWidth; column++) {
                const cellState = this.currentWorldState[row][column];
                let cellColor = DRY_SOIL_COLOR;

                if (cellState === STATE_MOIST) {
                    cellColor = MOIST_SOIL_COLOR;
                } else if (cellState === STATE_GRASS) {
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

        if (
            row < 0 ||
            row >= this.gridHeight ||
            column < 0 ||
            column >= this.gridWidth
        ) {
            return;
        }

        if (this.currentWorldState[row][column] === STATE_DRY) {
            this.currentWorldState[row][column] = STATE_MOIST;
            this.renderWorld();
        }
    }

    private handleShutdown ()
    {
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.stepTimer?.remove(false);
    }
}
