import { Scene } from 'phaser';

const CONTEXT_MENU_BG_COLOR = 0x232323;
const CONTEXT_MENU_BORDER_COLOR = 0x505050;
const CONTEXT_MENU_TEXT_COLOR = '#ffffff';

export type CellContextMenuAction = {
    label: string;
    onSelect: () => void;
};

export class CellContextMenu
{
    private menuContainer?: Phaser.GameObjects.Container;
    private menuBounds?: Phaser.Geom.Rectangle;

    constructor (private readonly scene: Scene)
    {
    }

    public get isOpen (): boolean
    {
        return !!this.menuContainer;
    }

    public containsPoint (x: number, y: number): boolean
    {
        return this.menuBounds?.contains(x, y) ?? false;
    }

    public open (x: number, y: number, actions: CellContextMenuAction[]): void
    {
        this.close();

        const menuWidth = 180;
        const itemHeight = 28;
        const padding = 6;
        const menuHeight = padding * 2 + itemHeight * actions.length;

        const menuX = Phaser.Math.Clamp(x, 0, this.scene.scale.width - menuWidth);
        const menuY = Phaser.Math.Clamp(y, 0, this.scene.scale.height - menuHeight);

        const background = this.scene.add.rectangle(menuX, menuY, menuWidth, menuHeight, CONTEXT_MENU_BG_COLOR, 0.95)
            .setOrigin(0)
            .setStrokeStyle(1, CONTEXT_MENU_BORDER_COLOR);

        const menuObjects: Phaser.GameObjects.GameObject[] = [background];

        actions.forEach((action, index) => {
            const itemY = menuY + padding + index * itemHeight;

            const hitArea = this.scene.add.rectangle(menuX + 1, itemY, menuWidth - 2, itemHeight, 0xffffff, 0.001)
                .setOrigin(0)
                .setInteractive({ useHandCursor: true });

            const label = this.scene.add.text(menuX + 10, itemY + 6, action.label, {
                fontFamily: 'Arial',
                fontSize: '14px',
                color: CONTEXT_MENU_TEXT_COLOR
            });

            hitArea.on('pointerdown', () => {
                action.onSelect();
            });

            menuObjects.push(hitArea, label);
        });

        this.menuContainer = this.scene.add.container(0, 0, menuObjects).setDepth(50);
        this.menuBounds = new Phaser.Geom.Rectangle(menuX, menuY, menuWidth, menuHeight);
    }

    public close (): void
    {
        this.menuContainer?.destroy(true);
        this.menuContainer = undefined;
        this.menuBounds = undefined;
    }

    public destroy (): void
    {
        this.close();
    }
}