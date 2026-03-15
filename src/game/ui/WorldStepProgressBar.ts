import { Scene } from 'phaser';

const BAR_HEIGHT = 6;
const BAR_COLOR_BG = 0x333333;
const BAR_COLOR_FILL = 0x44aaff;

export class WorldStepProgressBar
{
    private background: Phaser.GameObjects.Rectangle;
    private fill: Phaser.GameObjects.Rectangle;

    constructor (
        private readonly scene: Scene,
        private readonly timer: Phaser.Time.TimerEvent
    )
    {
        const width = scene.scale.width;
        const y = scene.scale.height - BAR_HEIGHT;

        this.background = scene.add.rectangle(0, y, width, BAR_HEIGHT, BAR_COLOR_BG)
            .setOrigin(0)
            .setDepth(100);

        this.fill = scene.add.rectangle(0, y, 0, BAR_HEIGHT, BAR_COLOR_FILL)
            .setOrigin(0)
            .setDepth(101);
    }

    public update (): void
    {
        const width = this.scene.scale.width;
        const progress = this.timer.getProgress();
        this.background.width = width;
        this.fill.width = width * progress;
    }

    public destroy (): void
    {
        this.background.destroy();
        this.fill.destroy();
    }
}
