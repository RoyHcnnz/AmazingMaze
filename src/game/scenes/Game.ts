import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Maze } from '../MazeCore/Maze';

export class Game extends Scene
{
    cellWidth: number;

    constructor ()
    {
        super('Game');
        this.cellWidth = 15;
        
    }

    drawMaze(rown: number, coln: number, offset_x: number, offset_y: number): 
    void{
        const maze = new Maze(rown, coln);
        for(let r:number = 0; r<rown; r++){
            for (let c: number = 0; c<coln; c++){
                this.drawMazeCell(
                    offset_x + c*this.cellWidth, 
                    offset_y + r*this.cellWidth,
                    maze.maze[r][c]
                );
            }
        }
    }

    // walls value 0xnnnn as up down left right
    drawMazeCell(x: number, y: number, walls: number): void{
        var up = (walls>>3) % 2 == 1;
        var down = (walls>>2) % 2 == 1;
        var left = (walls>>1) % 2 == 1;
        var right = walls % 2 == 1;
        if(up){
            this.add.line(0, 0, x, y, x+this.cellWidth, y, 0x000000).setOrigin(0);
        }
        if(down){
            this.add.line(0, 0, x, y+this.cellWidth, 
                x+this.cellWidth, y+this.cellWidth, 0x000000).setOrigin(0);
        }
        if(left){
            this.add.line(0, 0, x, y, x, y+this.cellWidth, 0x000000).setOrigin(0);
        }
        if(right){
            this.add.line(0, 0, x+this.cellWidth, y, x+this.cellWidth, y+this.cellWidth, 0x000000).setOrigin(0);
        }
    }

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('star', 'star.png');
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        //this.add.grid(160, 310, 300, 600, 15, 15, undefined, undefined, 0x000000);
        //var rec = this.add.rectangle(160, 310, 300, 600);
        //rec.setStroke,Style(2, 0)
        this.drawMaze(40, 20, 10, 10);
        EventBus.emit('current-scene-ready', this);

    }
}
