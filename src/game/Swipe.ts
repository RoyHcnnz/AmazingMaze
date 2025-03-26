export enum SwipeDirection {
    UP,
    DOWN,
    LEFT,
    RIGHT,
    NONE
}


export class Swipe{
    scene: Phaser.Scene;
    swipeCallAction: (direction: SwipeDirection) => void;
    pointerDownLoc: [number, number];
    pointerUpLoc: [number, number];

    effectArea_up?: number;
    effectArea_down?: number;
    effectArea_left?: number;
    effectArea_right?: number;

    swipeDirection: SwipeDirection;

    constructor(
        scene: Phaser.Scene, 
        swipeCallBack: (direction: SwipeDirection) => void,
        effectArea_up?: number,
        effectArea_down?: number,
        effectArea_left?: number,
        effectArea_right?: number
    ){
        this.scene = scene;
        this.effectArea_up = effectArea_up;
        this.effectArea_down = effectArea_down;
        this.effectArea_left = effectArea_left;
        this.effectArea_right = effectArea_right;
        this.swipeDirection = SwipeDirection.NONE;
        this.swipeCallAction = swipeCallBack;
        this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
        this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
            this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
        });
    }

    handlePointerDown(pointer: Phaser.Input.Pointer){
        this.pointerDownLoc = [pointer.position.x, pointer.position.y];
    }

    handlePointerUp(pointer: Phaser.Input.Pointer){
        this.pointerUpLoc = [pointer.position.x, pointer.position.y];
        this.swipeDirection = this.findSwipeDirection();
        if(
            this.effectArea_up && this.effectArea_down 
            && this.effectArea_left && this.effectArea_right
        ){
            if(
                this.pointerDownLoc[0] < this.effectArea_left 
                || this.pointerDownLoc[0] > this.effectArea_right
                || this.pointerDownLoc[1] < this.effectArea_up
                || this.pointerDownLoc[1] > this.effectArea_down
            ){ // if there is boundary and outside boundary
                this.swipeDirection = SwipeDirection.NONE;
            }
        }

        if(this.swipeDirection != SwipeDirection.NONE){
            this.swipeCallAction(this.swipeDirection);
        }
    }
    
    findSwipeDirection(): SwipeDirection{
        var x_movement = this.pointerUpLoc[0] - this.pointerDownLoc[0];
        var y_movement = this.pointerUpLoc[1] - this.pointerDownLoc[1];
        if(Math.abs(x_movement) > Math.abs(y_movement) 
            && Math.abs(x_movement)> 100)
        {
            if(x_movement > 0){
                return SwipeDirection.RIGHT;
            }else{
                return SwipeDirection.LEFT;
            }
        }
        if(Math.abs(y_movement) > Math.abs(x_movement) 
            && Math.abs(y_movement)> 100)
        {
            if(y_movement > 0){
                return SwipeDirection.DOWN;
            }else{
                return SwipeDirection.UP;
            }
        }
        return SwipeDirection.NONE
    }
    
}