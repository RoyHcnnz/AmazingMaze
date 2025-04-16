import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { Maze, Direction } from '../MazeCore/Maze';
import { Swipe, SwipeDirection } from '../Swipe';

const colorPalette = {
    primary: '#ec4899',
    primary_d10: '#d4418a',
    primary_d20: '#bd3a7a',
    primary_d30: '#a5326b',
    secondary: '',
    background: '#fdf2f8',
    yellow: '#ffd359',
    blue: '#0081d6',
    green: '#5dbab2',
    red: '#ff607f',
    orange: '#ff8468'
}

const TEXT_COLOR = colorPalette.primary;
const TEXT_HOVER_COLOR = colorPalette.primary_d30;
const TEXT_DOWN_COLOR = colorPalette.primary_d30;
const BACKGROUND_COLOR = colorPalette.background;
const MAZE_COLOR = colorPalette.primary;
const PLAYER_COLOR = colorPalette.blue;
const STARTING_CELL_COLOR = colorPalette.green;
const ENDING_CELL_COLOR = colorPalette.red;
const COIN_COLOR = colorPalette.yellow;
const PROGRESS_BAR_COLOR = colorPalette.primary;
const PATH_COLOR = colorPalette.orange;



export class Game extends Scene
{
    cellWidth: number;
    offset_x: number;
    offset_y: number;

    maze: Maze;
    mazeReward: number = 2; // the amount of coins when a mazed is solved
    pathCost: number = 3; // the price of show path
    
    // maze drawing is an array of four lines which are the up, down, left and right walls of the cell
    mazeDrawing: [GameObjects.Line, GameObjects.Line, GameObjects.Line, GameObjects.Line][]; 
    player: GameObjects.Arc;
    startingCell: GameObjects.Shape;
    endingCell: GameObjects.Shape;
    pathDrawing: GameObjects.Arc[];
    coinDrawing: GameObjects.Shape[];

    // text display
    regenerateButton: GameObjects.Text;
    pathButton: GameObjects.Text;
    algorithm: GameObjects.Text;
    coinAmountDisplay: GameObjects.Text;

    cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    playerMoved: boolean;

    progressBar: GameObjects.Rectangle;

    
    constructor ()
    {
        super('Game');
        this.cellWidth = 15;
        this.maze = new Maze(40, 20);
        this.mazeDrawing = []; 
        this.pathDrawing = [];
        this.coinDrawing = [];

        this.offset_x = 10;
        this.offset_y = 110;
        this.playerMoved = false;
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
        // create graph
        this.createGUI();
        this.createMaze(this.offset_x, this.offset_y);
        this.createEndingCell(this.offset_x, this.offset_y);
        this.createStartingCell(this.offset_x, this.offset_y);
        this.createPlayer(this.offset_x, this.offset_y, this.maze.start_point_r, this.maze.start_point_c);
        // init
        this.resetMaze();
        // generate
        this.generateMaze();

        /**************************************************************/
        
        /*
        this.scroeBoard = this.add.text( 160, 10, 'Score: ' + this.score, { font: '16px Courier', color: '#00ff00' });
        if(this.input.keyboard){
            this.cursors = this.input.keyboard?.createCursorKeys();
        }else{
            console.log('no keyboard');
        }
        */

        // this.drawMaze(this.offset_x, this.offset_y);
        //this.drawPlayer(this.offset_x, this.offset_y, this.maze.start_point_r, this.maze.start_point_c);
        EventBus.emit('current-scene-ready', this);
    }

    createGUI(){
        // generate progress bar
        this.drawProgressBar();
        this.regenerateButton = this.add.text(
            10, 10, 
            'New Maze', 
            { font: '16px Courier', color: TEXT_COLOR}
        ).setInteractive().on('pointerover', () => {
            this.regenerateButton.setStyle({ fill: TEXT_HOVER_COLOR });
        }).on('pointerout', () => {
            this.regenerateButton.setStyle({ fill: TEXT_COLOR});
        }).on('pointerdown', () => {
            this.resetMaze();
            this.generateMaze();
            this.regenerateButton.setVisible(false);
        }).setVisible(false);
        // this.regenerateButton.preFX?.addShadow();

        this.coinAmountDisplay = this.add.text(
            160, 10,
            'coin: 0',
            { font: '16px Courier', color: TEXT_COLOR }
        ).setInteractive().on('pointerover', () => {
            this.regenerateButton.setStyle({ fill: TEXT_HOVER_COLOR });
        }).on('pointerout', () => {
            this.regenerateButton.setStyle({ fill: TEXT_COLOR });
        }).on('pointerdown', () => {
            this.resetMaze();
            this.generateMaze();
            this.regenerateButton.setVisible(false);
        });

        this.pathButton = this.add.text(
            10, 40, 
            'show path(3 coins)', 
            { font: '16px Courier', color: TEXT_COLOR }
        ).setInteractive().on('pointerover', () => {
            this.pathButton.setStyle({ fill: TEXT_HOVER_COLOR });
        }).on('pointerout', () => {
            this.pathButton.setStyle({ fill: TEXT_COLOR });
        }).on('pointerdown', () => {
            if(this.pathDrawing.length == 0){
                if(this.maze.spend_coin(this.pathCost)){
                    this.drawPath(this.offset_x, this.offset_y);
                    this.updateCoinAmount();
                }
            }
        }).setVisible(false);

        this.algorithm = this.add.text(
            10, 70, "algorithm: " + this.maze.algorithm,  
            { font: '16px Courier', color: TEXT_COLOR }
        );

        // Control
        // add swipe gesture
        new Swipe(
            this, 
            (direction: SwipeDirection) => {
                if(direction == SwipeDirection.UP){
                    this.playerMoved = this.maze.move_player(Direction.UP);
                }
                if(direction == SwipeDirection.DOWN){
                    this.playerMoved = this.maze.move_player(Direction.DOWN);
                }
                if(direction == SwipeDirection.LEFT){
                    this.playerMoved = this.maze.move_player(Direction.LEFT);
                }
                if(direction == SwipeDirection.RIGHT){
                    this.playerMoved = this.maze.move_player(Direction.RIGHT);
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
    }

    update(){
        if(this.playerMoved){
            if(this.pathDrawing.length != 0){
                this.removePath();
            }
            this.updateCoins(this.offset_x, this.offset_y);
            this.updatePlayer();
            this.updateCoinAmount();
            this.playerMoved = false;
            if(this.maze.game_over()){
                console.log("you win");
                this.maze.add_coin(this.mazeReward);
                this.updateCoinAmount();
                this.resetMaze();
                this.generateMaze();
            }
        }
    }

    markCell(row: number, col: number, 
        offset_x: number, offset_y: number, 
        color: number, alpha: number, primary?: boolean): GameObjects.Shape
    {
        if(primary){
            let draw = this.add.rectangle(
                offset_x + col*this.cellWidth, 
                offset_y + row*this.cellWidth, 
                this.cellWidth - 3, 
                this.cellWidth - 3, 
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

    createPlayer(offset_x: number, offset_y: number, r: number, c: number){
        this.player = this.markCell(
            r, c, offset_x, offset_y, 
            Number(PLAYER_COLOR.replace('#', '0x')), 1
        ) as GameObjects.Arc;
    }

    createMaze(offset_x: number, offset_y: number): void{
        var rown = this.maze.rown;
        var coln = this.maze.coln;
        for(let r:number = 0; r<rown; r++){
            for (let c: number = 0; c<coln; c++){
                this.mazeDrawing.push(
                    this.createMazeCell(
                        offset_x + c*this.cellWidth, 
                        offset_y + r*this.cellWidth
                    )
                )
            }
        }
    }

    createMazeCell(x: number, y: number): 
        [GameObjects.Line, GameObjects.Line, GameObjects.Line, GameObjects.Line] 
    {
        var cellDrawing: [
            GameObjects.Line, GameObjects.Line, 
            GameObjects.Line, GameObjects.Line
        ] = [
            // up
            this.add.line(
                0, 0, 
                x, y, 
                x+this.cellWidth, y, 
                Number(MAZE_COLOR.replace('#', '0x'))
            ).setOrigin(0),

            // down
            this.add.line(
                0, 0, 
                x, y+this.cellWidth, 
                x+this.cellWidth, y+this.cellWidth, 
                Number(MAZE_COLOR.replace('#', '0x'))
            ).setOrigin(0),

            // left
            this.add.line(
                0, 0, 
                x, y, 
                x, y+this.cellWidth, 
                Number(MAZE_COLOR.replace('#', '0x'))
            ).setOrigin(0),

            // right
            this.add.line(
                0, 0, 
                x+this.cellWidth, 
                y, x+this.cellWidth, 
                y+this.cellWidth, 
                Number(MAZE_COLOR.replace('#', '0x'))
            ).setOrigin(0)
        ];
        
        return cellDrawing;
    }

    createStartingCell(offset_x: number, offset_y: number){
        this.startingCell = this.markCell(
            0, 0, offset_x, offset_y, 
            Number(STARTING_CELL_COLOR.replace('#', '0x')), 1, true
        );
        this.startingCell.visible = false;
    }

    createEndingCell(offset_x: number, offset_y: number){
        this.endingCell = this.markCell(
            0, 0, offset_x, offset_y, 
            Number(ENDING_CELL_COLOR.replace('#', '0x')), 1, true
        );
        this.endingCell.visible = false;
    }

    updateMaze(): void{
        var rown = this.maze.rown;
        var coln = this.maze.coln;
        for(let r:number = 0; r<rown; r++){
            for (let c: number = 0; c<coln; c++){
                this.updateMazeCell(
                    this.maze.maze[r][c],
                    this.mazeDrawing[c + r * this.maze.coln]
                );
            }
        }
    }

    updateStartingCell(): void{
        var row = this.maze.start_point_r;
        var col = this.maze.start_point_c;
        this.startingCell
            .setX(this.offset_x + col*this.cellWidth + 1)
            .setY(this.offset_y + row*this.cellWidth + 2)
            .setVisible(true);
    }

    updateEndingCell(): void{
        var row = this.maze.end_point_r;
        var col = this.maze.end_point_c;
        this.endingCell
            .setX(this.offset_x + col*this.cellWidth + 1)
            .setY(this.offset_y + row*this.cellWidth + 2)
            .setVisible(true);
    }

    updateCoinAmount(): void{
        this.coinAmountDisplay.setText('Coin: ' + this.maze.coin_amount);
    }

    updateCoins(offset_x: number, offset_y: number): void{
        this.coinDrawing.map((g) => { g.destroy() }) // destroy old ones
        var coins_pos = this.maze.get_coins_pos();
        coins_pos.map((p) => {
            var r = p[0];
            var c = p[1];
            this.coinDrawing.push(
                this.markCell(
                    r, c, offset_x, offset_y, 
                    Number(COIN_COLOR.replace('#', '0x')), 1
                )
            );
        })
    }

    // walls value 0xnnnn as up down left right
    updateMazeCell(
        walls: number, 
        cellDrawing: [
            GameObjects.Line, GameObjects.Line, 
            GameObjects.Line, GameObjects.Line
        ]
    ): void{
        var up = (walls>>3) % 2 == 1;
        var down = (walls>>2) % 2 == 1;
        var left = (walls>>1) % 2 == 1;
        var right = walls % 2 == 1;

        cellDrawing[0].setVisible(up);
        cellDrawing[1].setVisible(down);
        cellDrawing[2].setVisible(left);
        cellDrawing[3].setVisible(right);
    }

    drawPath(offset_x: number, offset_y: number){
        var path = this.maze.find_solution();
        path.map((cell_rc) => {
            var r: number;
            var c: number;
            [r, c] = cell_rc;
            let draw = this.markCell(
                r, c, offset_x, offset_y, 
                Number(PATH_COLOR.replace('#', '0x')), 0.7
            ) as GameObjects.Arc;
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

    resetMaze(){
        this.removePath();
        this.updateCoins(this.offset_x, this.offset_y);
        this.startingCell.setVisible(false);
        this.endingCell.setVisible(false);
        this.player.setVisible(false);
        this.regenerateButton.setVisible(false);
        this.pathButton.setVisible(false);
        this.progressBar.setVisible(false);
    }

    generateMaze(){
        var mazeGen = this.maze.generate();
        var genStep = mazeGen.next();
        this.updateCoins(this.offset_x, this.offset_y);
        this.progressBar.setVisible(true);
        this.algorithm.setText("algorithm: " + this.maze.algorithm);
        this.updateEndingCell();
        var generateMazeStep = this.time.addEvent({
            delay: 2, // ms
            callback: () => {
                if(!genStep.done){
                    genStep = mazeGen.next();
                    var p = genStep.value;
                    this.updateProgressBar(p);
                    this.updateMaze();
                    this.updateEndingCell();
                }else{
                    this.updatePlayer();
                    //this.updateStartingCell();
                    this.updateCoins(this.offset_x, this.offset_y);
                    this.regenerateButton.setVisible(true);
                    this.pathButton.setVisible(true);
                    this.progressBar.setVisible(false);
                    generateMazeStep.remove();
                    generateMazeStep.destroy();
                }
            },
            loop: true,
            startAt: 0,
            timeScale: 1,
            paused: false,
        });

        //this.drawMaze(10, 110);
        this.playerMoved = false;
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

    drawProgressBar(){
        this.progressBar = this.add.rectangle(
            10, 86, 
            300, 10, 
            Number(PROGRESS_BAR_COLOR.replace('#', '0x'))
        ).setOrigin(0);
    }

    updateProgressBar(progress: number){
        if(this.progressBar){
            this.progressBar.setSize(300*progress, 10);
        }
    }
}
