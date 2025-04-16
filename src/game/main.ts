import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Types } from 'phaser';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 320,
    height: 812,
    parent: 'game-container',
    backgroundColor: '#fdf2f8',
    scene: [
        MainGame
    ]
};

const StartGame = (parent: any) => {
    return new Game({ ...config, parent });
}

export default StartGame;

