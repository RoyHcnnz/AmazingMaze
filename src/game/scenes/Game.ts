import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Maze, Direction } from '../MazeCore/Maze';
import { Swipe, SwipeDirection } from '../Swipe';

export class Game extends Scene
{
    cellWidth: number;
    maze: Maze;
    mazeDrawing: GameObjects.Shape[]; 
    startingCell: GameObjects.Shape;
    pathDrawing: GameObjects.Arc[];
    regenerateButton: GameObjects.Text;
    algorithm: GameObjects.Text;
    player: GameObjects.Arc;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    offset_x: number;
    offset_y: number;
    playerMoved: boolean;

    score: number = 0;
    scroeBoard: GameObjects.Text;
    
    constructor ()
    {
        super('Game');
        this.cellWidth = 15;
        this.maze = new Maze(40, 20);
        this.mazeDrawing = []; 
        this.pathDrawing = [];

        this.offset_x = 10;
        this.offset_y = 110;
        this.playerMoved = false;
    }

    markCell(row: number, col: number, 
        offset_x: number, offset_y: number, 
        color: number, alpha: number, primary?: boolean): GameObjects.Shape
    {
        if(primary){
            let draw = this.add.rectangle(
                offset_x + col*this.cellWidth + 2, 
                offset_y + row*this.cellWidth + 2, 
                this.cellWidth - 1, 
                this.cellWidth - 1, 
                color, alpha
            ).setOrigin(0);
            return draw;
        }else{
            let draw = this.add.circle(
                offset_x + col*this.cellWidth + this.cellWidth/2, 
                offset_y + row*this.cellWidth + this.cellWidth/2, 
                this.cellWidth/4,
                color, alpha
            );
            return draw;
        }

    }

    drawPlayer(offset_x: number, offset_y: number, r: number, c: number){
        this.player = this.markCell(r, c, offset_x, offset_y, 0x0000ff, 1) as GameObjects.Arc;
    }

    drawMaze(offset_x: number, offset_y: number): void{
        var rown = this.maze.rown;
        var coln = this.maze.coln;
        for(let r:number = 0; r<rown; r++){
            for (let c: number = 0; c<coln; c++){
                this.drawMazeCell(
                    offset_x + c*this.cellWidth, 
                    offset_y + r*this.cellWidth,
                    this.maze.maze[r][c]
                );
                if(r == this.maze.start_point_r && c == this.maze.start_point_c){
                    let starting_cell = this.markCell(
                        r, c, offset_x, offset_y, 
                        0x008000, 0.5, true
                    );
                    this.startingCell = starting_cell;
                    this.startingCell.visible = false;
                }
                if(r == this.maze.end_point_r && c == this.maze.end_point_c){
                    let ending_cell = this.markCell(
                        r, c, offset_x, offset_y, 
                        0xff0000, 0.5, true
                    );
                    this.mazeDrawing.push(ending_cell);
                }
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
            let edge = this.add.line(
                0, 0, 
                x, y, 
                x+this.cellWidth, y, 
                0x000000).setOrigin(0);
            this.mazeDrawing.push(edge);
        }
        if(down){
            let edge = this.add.line(
                0, 0, 
                x, y+this.cellWidth, 
                x+this.cellWidth, y+this.cellWidth, 
                0x000000).setOrigin(0);
            this.mazeDrawing.push(edge);
        }
        if(left){
            let edge = this.add.line(
                0, 0, 
                x, y, 
                x, y+this.cellWidth, 
                0x000000).setOrigin(0);
            this.mazeDrawing.push(edge);
        }
        if(right){
            let edge = this.add.line(
                0, 0, 
                x+this.cellWidth, 
                y, x+this.cellWidth, 
                y+this.cellWidth, 
                0x000000).setOrigin(0);
            this.mazeDrawing.push(edge);
        }
    }

    drawPath(offset_x: number, offset_y: number){
        var path = this.maze.find_solution();
        path.map((cell_rc) => {
            var r: number;
            var c: number;
            [r, c] = cell_rc;
            let draw = this.markCell(r, c, offset_x, offset_y, 0xffff00, 0.7) as GameObjects.Arc;
            //hide draw
            this.pathDrawing.push(draw);
        })
    }

    removePath(){
        this.pathDrawing.map((item) => {
            item.destroy();
        });
        this.pathDrawing = [];
    }

    regenerateMaze(){
        this.mazeDrawing.map((item) => {
            item.destroy();
        });
        this.mazeDrawing = [];
        this.pathDrawing.map((item) => {
            item.destroy();
        });
        this.pathDrawing = [];
        //this.maze.createMaze();
        
        this.startingCell.visible = false;
        this.player.visible = false;
        this.regenerateButton.setVisible(false);
        var mazeGen = this.maze.generate();
        var genStep = mazeGen.next();
        var generateMazeStep = this.time.addEvent({
            delay: 10, // ms
            callback: () => {
                if(!genStep.done){
                    genStep = mazeGen.next();
                    this.updateMaze();
                }else{
                    this.updatePlayer();
                    this.startingCell.visible = true;
                    this.regenerateButton.setVisible(true);
                    generateMazeStep.remove();
                    generateMazeStep.destroy();
                }
            },
            loop: true,
            startAt: 0,
            timeScale: 1,
            paused: false,
        });
        
        this.algorithm.setText(this.maze.algorithm);
        //this.drawMaze(10, 110);
        this.playerMoved = false;
    }

    updateMaze(){
        this.mazeDrawing.map((item) => {
            item.destroy();
        });
        this.mazeDrawing = [];
        this.drawMaze(this.offset_x, this.offset_y);
    }

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('star', 'star.png');
        this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
    }

    updatePlayer(){
        this.player.x = this.offset_x 
                        + this.maze.player_c*this.cellWidth 
                        + this.cellWidth/2;
        this.player.y = this.offset_y 
                        + this.maze.player_r*this.cellWidth 
                            + this.cellWidth/2;   
        this.player.visible = true;
    }

    update(){
        if(this.playerMoved){
            this.updatePlayer();
            this.playerMoved = false;
            if(this.maze.game_over()){
                this.score += 1;
                this.scroeBoard.setText('Score: ' + this.score);
                this.regenerateMaze();
            }
        }
    }

    create ()
    {
        // this.maze.createMaze(); // this create maze immediatly 
        var mazeGen = this.maze.generate();
        var genStep = mazeGen.next();
        var generateMazeStep = this.time.addEvent({
            delay: 10, // ms
            callback: () => {
                if(!genStep.done){
                    genStep = mazeGen.next();
                    this.updateMaze();
                }else{
                    this.drawPlayer(this.offset_x, this.offset_y, this.maze.start_point_r, this.maze.start_point_c);
                    this.startingCell.visible = true;
                    this.regenerateButton.setVisible(true);
                    generateMazeStep.remove();
                    generateMazeStep.destroy();
                }
            },
            loop: true,
            startAt: 0,
            timeScale: 1,
            paused: false,
        });
          

        // add swipe gesture
        new Swipe(
            this, 
            (direction: SwipeDirection) => {
                if(direction == SwipeDirection.UP){
                    this.maze.move_player(Direction.UP);
                    this.playerMoved = true;
                }
                if(direction == SwipeDirection.DOWN){
                    this.maze.move_player(Direction.DOWN);
                    this.playerMoved = true;
                }
                if(direction == SwipeDirection.LEFT){
                    this.maze.move_player(Direction.LEFT);
                    this.playerMoved = true;
                    
                }
                if(direction == SwipeDirection.RIGHT){
                    this.maze.move_player(Direction.RIGHT);
                    this.playerMoved = true;
                }
            }
        )
        this.input.keyboard?.on(
            'keydown-UP', () => {
                this.playerMoved = this.maze.move_player(Direction.UP);
            }, this
        );
        this.input.keyboard?.on(
            'keydown-DOWN', () => {
                this.playerMoved = this.maze.move_player(Direction.DOWN);
            }, this
        );
        this.input.keyboard?.on(
            'keydown-LEFT', () => {
                this.playerMoved = this.maze.move_player(Direction.LEFT);
            }, this
        );
        this.input.keyboard?.on(
            'keydown-RIGHT', () => {
                this.playerMoved = this.maze.move_player(Direction.RIGHT);
            }, this
        );
        this.regenerateButton = this.add.text(
            10, 10, 
            'New Maze', 
            { font: '16px Courier', color: '#00ff00' }
        ).setInteractive().on('pointerover', () => {
            this.regenerateButton.setStyle({ fill: '#ff0'});
        }).on('pointerout', () => {
            this.regenerateButton.setStyle({ fill: '#00ff00'});
        }).on('pointerdown', () => {
            this.regenerateMaze();
            this.regenerateButton.setVisible(false);
        }).setVisible(false);

        var pathButton = this.add.text(
            10, 40, 
            'show/hide path', 
            { font: '16px Courier', color: '#00ff00' }
        ).setInteractive().on('pointerover', () => {
            pathButton.setStyle({ fill: '#ff0'});
        }).on('pointerout', () => {
            pathButton.setStyle({ fill: '#00ff00'});
        }).on('pointerdown', () => {
            if(this.pathDrawing.length == 0){
                this.drawPath(this.offset_x, this.offset_y);
            }else{
                this.removePath();
            }
        });

        this.algorithm = this.add.text(
            10, 70, "algorithm: " + this.maze.algorithm,  
            { font: '16px Courier', color: '#00ff00' }
        );

        this.scroeBoard = this.add.text( 160, 10, 'Score: ' + this.score, { font: '16px Courier', color: '#00ff00' });
        if(this.input.keyboard){
            this.cursors = this.input.keyboard?.createCursorKeys();
        }else{
            console.log('no keyboard');

        }
        this.drawMaze(this.offset_x, this.offset_y);
        //this.drawPlayer(this.offset_x, this.offset_y, this.maze.start_point_r, this.maze.start_point_c);
        EventBus.emit('current-scene-ready', this);


    }
}
