import { Scene } from 'phaser';

const CELL_SIZE = 24;
const STEP_DELAY = 1000;
const DEAD_CELL_COLOR = 0xd6b34b;
const ALIVE_CELL_COLOR = 0x1eb045;

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

        this.currentWorldState = this.createEmptyWorldState(); // Initial world state
        this.currentWorldState[14][19] = 1; // Example: Set a single alive cell
        this.nextWorldState = this.createEmptyWorldState();

        this.renderWorld();
    }

    private createEmptyWorldState ()
    {
        return Array.from({ length: this.gridHeight }, () => Array(this.gridWidth).fill(0));
    }

    private stepWorld ()
    {
        for (let row = 0; row < this.gridHeight; row++) {
            for (let column = 0; column < this.gridWidth; column++) {
                const currentCellState = this.currentWorldState[row][column];
                if (currentCellState === 1) {
                    this.nextWorldState[row][column] = 1; // Alive cells remain alive
                    continue;
                }
                // Dead cells have a chance to become alive based on the number of alive neighbors
                const aliveNeighbors = this.countAliveNeighbors(row, column);
                const reviveChance = 0.04 * aliveNeighbors;
                this.nextWorldState[row][column] = reviveChance >= Math.random() ? 1 : 0;
            }
        }
        [this.currentWorldState, this.nextWorldState] = [this.nextWorldState, this.currentWorldState];
        this.renderWorld();
    }

    private countAliveNeighbors (row: number, column: number)
    {
        let aliveNeighbors = 0;

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

                aliveNeighbors += this.currentWorldState[neighborRow][neighborColumn];
            }
        }

        return aliveNeighbors;
    }

    private renderWorld ()
    {
        this.gridGraphics.clear();

        for (let row = 0; row < this.gridHeight; row++) {
            for (let column = 0; column < this.gridWidth; column++) {
                const cellColor = this.currentWorldState[row][column] === 1 ? ALIVE_CELL_COLOR : DEAD_CELL_COLOR;
                this.gridGraphics.fillStyle(cellColor, 1);
                this.gridGraphics.fillRect(column * CELL_SIZE, row * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
            }
        }
    }

    private handleShutdown ()
    {
        this.stepTimer?.remove(false);
    }
}
