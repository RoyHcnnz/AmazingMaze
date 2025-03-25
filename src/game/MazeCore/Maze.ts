export enum Direction {
    UP = 3,
    DOWN = 2,
    LEFT = 1,
    RIGHT = 0,
}

enum Status {
    IN_PROGRESS,
    FINISHED
}

export class Maze{

    maze: number[][];
    rown: number;
    coln: number;
    start_point_r: number;
    start_point_c: number;
    end_point_r: number;
    end_point_c: number;
    solution_path: [number, number][];

    player_r: number;
    player_c: number;

    status: Status;

    constructor(rown: number, coln: number){
        this.rown = rown;
        this.coln = coln;
        this.solution_path = [];
        this.maze = new Array(rown).fill(null)
            .map(() => new Array(coln).fill(0b1111));
        [this.start_point_r, this.start_point_c] = this.pick_random_point();
        [this.end_point_r, this.end_point_c] = this.pick_random_point();

        this.player_r = this.start_point_r;
        this.player_c = this.start_point_c;

        this.generate();
        this.find_solution();
        this.status = Status.IN_PROGRESS;
    }

    move_player(direction: Direction){
        var r = this.player_r;
        var c = this.player_c;
        if(direction == Direction.UP){
            if(r>0 && (this.maze[r][c]>>3) % 2 == 0){
                this.player_r = r - 1;
            }
        }
        else if(direction == Direction.DOWN){
            if(r<this.rown-1 && (this.maze[r][c]>>2) % 2 == 0){
                this.player_r = r + 1;
            }
        }
        else if(direction == Direction.LEFT){
            if(c>0 && (this.maze[r][c]>>1) % 2 == 0){
                this.player_c = c - 1;
            }
        }
        else if(direction == Direction.RIGHT){
            if(c<this.coln-1 && this.maze[r][c] % 2 == 0){
                this.player_c = c + 1;
            }
        }
        if(this.player_r == this.end_point_r && 
            this.player_c == this.end_point_c){
            this.status = Status.FINISHED;
        }
    }


    // turn cell id to row and col
    cell_id_to_rc(id: number): [number, number]{
        var r = Math.floor(id / this.coln);
        var c = id % this.coln;
        return [r, c]
    }

    // turn row and col to cell id
    rc_to_cell_id(r: number, c: number): number{
        return r*this.coln + c;
    }

    pick_random_point(): [number, number]{
        var id = Math.floor(Math.random()*this.rown * this.coln);
        return this.cell_id_to_rc(id)
    }

    // remove the wall on the given direction and return and updated wall value
    remove_wall(original_wall_value: number, direction: Direction): number{
        return (original_wall_value ^ (1 << direction));
    }

    connnect_neighbors(cellA_id: number, cellB_id: number){
        if(cellA_id > cellB_id){
            let tmp = cellA_id;
            cellA_id = cellB_id;
            cellB_id = tmp
        }

        var A_r: number;
        var A_c: number;
        [A_r, A_c] = this.cell_id_to_rc(cellA_id);
        var B_r: number;
        var B_c: number;
        [B_r, B_c] = this.cell_id_to_rc(cellB_id);

        if(A_c == B_c){ // B is below A
            this.maze[A_r][A_c] = this.remove_wall(
                this.maze[A_r][A_c], Direction.DOWN
            );
            this.maze[B_r][B_c] = this.remove_wall(
                this.maze[B_r][B_c], Direction.UP
            );
        }
        else if(A_r == B_r){ // B on the right A
            this.maze[A_r][A_c] = this.remove_wall(
                this.maze[A_r][A_c], Direction.RIGHT
            );
            this.maze[B_r][B_c] = this.remove_wall(
                this.maze[B_r][B_c], Direction.LEFT
            );
        }
    }

    generate(){
        var frontier: number[] = [this.rc_to_cell_id(
            this.start_point_r, this.start_point_c
        )];
        var reached: Set<number> = new Set([this.rc_to_cell_id(
            this.start_point_r, this.start_point_c
        )]);
        while(reached.size < this.rown * this.coln){
            // random pick from frontier
            let random_idx = Math.floor(Math.random() * frontier.length);
            var current_cell_id = frontier[random_idx];
            // get all available neighbors(not reached and within border)
            var r: number;
            var c: number;
            var neighbors: number[] = [];
            [r, c] = this.cell_id_to_rc(current_cell_id);
            
            // up
            if (r>0 && !reached.has(this.rc_to_cell_id(r-1, c)) ){
                neighbors.push(this.rc_to_cell_id(r-1, c))
            }
            // down
            if (r<this.rown-1 && !reached.has(this.rc_to_cell_id(r+1, c)) ){ 
                neighbors.push(this.rc_to_cell_id(r+1, c))
            }
            // left
            if (c>0 && !reached.has(this.rc_to_cell_id(r, c-1)) ){ 
                neighbors.push(this.rc_to_cell_id(r, c-1))
            }
            // right
            if (c<this.coln-1 && !reached.has(this.rc_to_cell_id(r, c+1)) ){ 
                neighbors.push(this.rc_to_cell_id(r, c+1))
            }

            //  if no available remove from frontier
            if(neighbors.length == 0){
                let index = frontier.indexOf(current_cell_id);
                if (index > -1) {
                    frontier.splice(index, 1);
                }
            }
            //  if available more than one
            //      random pick one and connect neignbor, add neibor to 
            //      frontier and reached 
            else if(neighbors.length > 1){
                let random_idx = Math.floor(Math.random() * neighbors.length);
                var next_cell_id = neighbors[random_idx];
                this.connnect_neighbors(current_cell_id, next_cell_id);
                frontier.push(next_cell_id);
                reached.add(next_cell_id);
            }
            //  if availble exactly one
            //      connect and remove current cell from reached, add neighbor to frontier and reached
            else{
                var next_cell_id = neighbors[0];
                this.connnect_neighbors(current_cell_id, next_cell_id);
                frontier.push(next_cell_id);
                reached.add(next_cell_id);
                
                // remove current
                let index = frontier.indexOf(current_cell_id);
                if (index > -1) {
                    frontier.splice(index, 1);
                }
            }
        }
    }

    find_solution(){
        // bfs
        var search_queue: number[] = [this.rc_to_cell_id(
            this.start_point_r, this.start_point_c
        )]; // use cell id
        var searched: Set<number> = new Set();

        // store each cell's previous cell, index as cell id and value is 
        // parent's id
        var parent: number[] = new Array(this.rown * this.coln).fill(null);
        parent[this.rc_to_cell_id(this.start_point_r, this.start_point_c)] = -1;

        var reached_end = false;
        // bfs start
        while(!reached_end){
            let current_cell = search_queue[0];
            search_queue.shift();
            searched.add(current_cell);
            var r: number;
            var c: number;
            [r, c] = this.cell_id_to_rc(current_cell);
            let current_walls = this.maze[r][c];

            reached_end = (current_cell == this.rc_to_cell_id(
                this.end_point_r, this.end_point_c
            ))
            
            var up = (current_walls>>3) % 2 == 0;
            var down = (current_walls>>2) % 2 == 0;
            var left = (current_walls>>1) % 2 == 0;
            var right = current_walls % 2 == 0;
            if(up){
                var up_cell = current_cell - this.coln;
                if(!searched.has(up_cell)){
                    parent[up_cell] = current_cell;
                    search_queue.push(up_cell);
                }
            }
            if(down){
                var down_cell = current_cell + this.coln;
                if(!searched.has(down_cell)){
                    parent[down_cell] = current_cell;
                    search_queue.push(down_cell);
                }
            }
            if(left){
                var left_cell = current_cell - 1;
                if(!searched.has(left_cell)){
                    parent[left_cell] = current_cell;
                    search_queue.push(left_cell);
                }
            }
            if(right){
                var right_cell = current_cell + 1;
                if(!searched.has(right_cell)){
                    parent[right_cell] = current_cell;
                    search_queue.push(right_cell);
                }
            }
        }

        // save path
        var current_cell = parent[this.rc_to_cell_id(
            this.end_point_r, this.end_point_c
        )];
        var start_cell_id = this.rc_to_cell_id(
            this.start_point_r, this.start_point_c
        );
        while(current_cell != start_cell_id){
            this.solution_path.push(this.cell_id_to_rc(current_cell));
            current_cell = parent[current_cell];
        }
    }

    reGen(){
        this.solution_path = [];
        this.maze = new Array(this.rown).fill(null)
            .map(() => new Array(this.coln).fill(0b1111));
        [this.start_point_r, this.start_point_c] = this.pick_random_point();
        [this.end_point_r, this.end_point_c] = this.pick_random_point();

        this.player_r = this.start_point_r;
        this.player_c = this.start_point_c;

        this.generate();
        this.find_solution();
        this.status = Status.IN_PROGRESS;
    }

    game_over(){
        return this.status == Status.FINISHED;
    }
}


