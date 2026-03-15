import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Scale } from 'phaser';


const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#888888',
    scale: {
        mode: Scale.RESIZE,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        MainGame
    ]
};

const StartGame = (parent: string): Game => {
    return new Game({ ...config, parent });
}

export default StartGame;
