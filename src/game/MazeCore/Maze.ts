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
    status: Status;
    algorithm: string;
    // solution_path: [number, number][];

    private parent: number[]; // use cell id, index as cell and value as it's parent

    player_r: number;
    player_c: number;

    constructor(rown: number, coln: number){
        this.rown = rown;
        this.coln = coln;
        // this.solution_path = [];
        this.parent = new Array(rown * coln).fill(-1);
        this.maze = new Array(rown).fill(null)
            .map(() => new Array(coln).fill(0b1111));
        // comfirm end point first and after created maze, pick a random 
        // start cell
        // so that all cells can follow their parent to reach end point
        [this.end_point_r, this.end_point_c] = this.pick_random_point();
        this.generate();
        this.pick_start_cell();

        // pick start point
        //[this.start_point_r, this.start_point_c] = this.pick_random_point();

        this.player_r = this.start_point_r;
        this.player_c = this.start_point_c;

        this.status = Status.IN_PROGRESS;
    }

    move_player(direction: Direction){
        var r = this.player_r;
        var c = this.player_c;
        if(direction == Direction.UP){
            if(r>0 && (this.maze[r][c]>>3) % 2 == 0){
                r = r - 1;
                while(r>0 && (this.maze[r][c] == 0b0011) 
                    && (r != this.end_point_r || c != this.end_point_c)
                ){
                    r = r - 1;
                }
                this.player_r = r;
            }
        }
        else if(direction == Direction.DOWN){
            if(r<this.rown-1 && (this.maze[r][c]>>2) % 2 == 0){
                r = r + 1;
                while(r<this.rown-1 && (this.maze[r][c] == 0b0011)
                    && (r != this.end_point_r || c != this.end_point_c)
                ){
                    r = r + 1;
                }
                this.player_r = r;
            }
        }
        else if(direction == Direction.LEFT){
            if(c>0 && (this.maze[r][c]>>1) % 2 == 0){
                c = c - 1;
                while(c>0 && (this.maze[r][c] == 0b1100)
                    && (r != this.end_point_r || c != this.end_point_c)
                ){
                    c = c - 1;
                }
                this.player_c = c;
            }
        }
        else if(direction == Direction.RIGHT){
            if(c<this.coln-1 && this.maze[r][c] % 2 == 0){
                c = c + 1;
                while(c<this.coln-1 && (this.maze[r][c] == 0b1100)
                    && (r != this.end_point_r || c != this.end_point_c)
                ){
                    c = c + 1;
                }
                this.player_c = c;
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
    
    set_wall(original_wall_value: number, direction: Direction): number{
        return (original_wall_value | (1 << direction));
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

    disconnnect_neighbors(cellA_id: number, cellB_id: number){
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
            this.maze[A_r][A_c] = this.set_wall(
                this.maze[A_r][A_c], Direction.DOWN
            );
            this.maze[B_r][B_c] = this.set_wall(
                this.maze[B_r][B_c], Direction.UP
            );
        }
        else if(A_r == B_r){ // B on the right A
            this.maze[A_r][A_c] = this.set_wall(
                this.maze[A_r][A_c], Direction.RIGHT
            );
            this.maze[B_r][B_c] = this.set_wall(
                this.maze[B_r][B_c], Direction.LEFT
            );
        }
    }

    // recursive 
    find_depth(cell_id: number, depth: number[]){
        if(depth[cell_id] != -1){
            return depth[cell_id];
        }

        if(this.parent[cell_id] == -1){
            depth[cell_id] = 0
        }else{
            depth[cell_id] = this.find_depth(this.parent[cell_id], depth) + 1;
        }
        return depth[cell_id];
    }

    // pick start cell after maze and parent is finished
    pick_start_cell(){
        var max_depth = -1
        var depth: number[] = new Array(this.rown * this.coln).fill(-1);
        for(var cell = 0; cell<this.rown*this.coln; cell++){
            var d = this.find_depth(cell, depth);
            if(d>max_depth){
                max_depth = d;
            }
        }
        var min_sol_length = max_depth * 3 / 4;
        var start_cell_pool: number[] = [];
        depth.map((d, cell) => {
            if(d > min_sol_length){
                start_cell_pool.push(cell)
            }
        });
        var start_cell = start_cell_pool[Math.floor(Math.random() * start_cell_pool.length)];
        [this.start_point_r, this.start_point_c] = this.cell_id_to_rc(start_cell);
    }

    generate(){
        //this.generate_by_Prim();
        /*
        */
        var i = Math.floor(Math.random()*3);
        if(i == 0){
            this.generate_by_growing_tree();
            this.algorithm = "Growing Tree";
        }else if(i == 1){
            this.generate_by_DFS();
            this.shift_origin(1000);
            this.algorithm = "DFS + Shift Origin 1000";
        }else{
            this.generate_by_Prim();
            this.algorithm = "Prim's"
        }
        //while(this.find_solution().length < (this.rown + this.coln)/2){
        //    this.add_complexity();
        //}
    }

    // use DFS to generate maze
    // and try generate end cell after depth > (rown + coln) * 2 if failed, 
    // then pick a random cell
    // problem: the main path doesn't have enough branches
    generate_by_DFS(){
        var currentPath: number[] = [this.rc_to_cell_id(
            this.end_point_r, this.end_point_c
        )];
        var reached: number[] = [this.rc_to_cell_id(
            this.end_point_r, this.end_point_c
        )];
        //var max_depth = depth; // for debug
        while(reached.length < this.rown * this.coln){
            //if(depth > max_depth){ // for debug
            //    max_depth = depth;
            //    console.log(max_depth);
            //}
            var currentCell = currentPath[currentPath.length - 1];
            var r: number;
            var c: number;
            [r, c] = this.cell_id_to_rc(currentCell);
            var available_neighbors: number[] = [];
            // up
            if (r>0 && !reached.includes(this.rc_to_cell_id(r-1, c)) ){
                available_neighbors.push(this.rc_to_cell_id(r-1, c))
            }
            // down
            if (r<this.rown-1 && !reached.includes(this.rc_to_cell_id(r+1, c))){ 
                available_neighbors.push(this.rc_to_cell_id(r+1, c))
            }
            // left
            if (c>0 && !reached.includes(this.rc_to_cell_id(r, c-1)) ){ 
                available_neighbors.push(this.rc_to_cell_id(r, c-1))
            }
            // right
            if (c<this.coln-1 && !reached.includes(this.rc_to_cell_id(r, c+1))){ 
                available_neighbors.push(this.rc_to_cell_id(r, c+1))
            }
            // if no neighbors, pop from path
            if(available_neighbors.length == 0){
                currentPath.pop();
            }
            else{
                let random_idx = Math.floor(
                    Math.random() * available_neighbors.length
                );
                var nextCell = available_neighbors[random_idx];
                this.parent[nextCell] = currentCell;
                this.connnect_neighbors(currentCell, nextCell);
                currentPath.push(nextCell);
                reached.push(nextCell);
            }
        }
    }

    // use Prim's algorithm to generate maze
    // problem: maze too easy, not enough tortuous
    generate_by_Prim(){
        //[this.end_point_r, this.end_point_c] = this.pick_random_point();
        var frontier: number[] = [this.rc_to_cell_id(
            this.end_point_r, this.end_point_c
        )];
        var reached: Set<number> = new Set([this.rc_to_cell_id(
            this.end_point_r, this.end_point_c
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
                this.parent[next_cell_id] = current_cell_id;
            }
            //  if availble exactly one
            //      connect and remove current cell from reached, add neighbor to frontier and reached
            else{
                var next_cell_id = neighbors[0];
                this.connnect_neighbors(current_cell_id, next_cell_id);
                frontier.push(next_cell_id);
                reached.add(next_cell_id);
                this.parent[next_cell_id] = current_cell_id;
                
                // remove current
                let index = frontier.indexOf(current_cell_id);
                if (index > -1) {
                    frontier.splice(index, 1);
                }
            }
        }
    }

    generate_by_growing_tree(branch_length: number = 4){
        var reached_cell: Set<number> = new Set(
            [this.rc_to_cell_id(this.end_point_r, this.end_point_c)]
        );
        var select_pool: Set<number> = new Set(
            [this.rc_to_cell_id(this.end_point_r, this.end_point_c)]
        );

        while(reached_cell.size < this.rown * this.coln){
            // random select from pool and remove
            // span four neigbors, add to reached and pool
            var current_cell = Array.from(select_pool)[Math.floor(
                Math.random() * select_pool.size
            )]
            select_pool.delete(current_cell);
            var current_branch_length = 0;
            var no_space = false;
            while(current_branch_length < branch_length && !no_space){
                current_branch_length ++;
                var r;
                var c;
                [r, c] = this.cell_id_to_rc(current_cell);
                var available_neighbors: number[] = [];
                // up
                if (r>0 && !reached_cell.has(this.rc_to_cell_id(r-1, c)) ){
                    available_neighbors.push(this.rc_to_cell_id(r-1, c))
                }
                // down
                if (r<this.rown-1 && !reached_cell.has(this.rc_to_cell_id(r+1, c)) ){ 
                    available_neighbors.push(this.rc_to_cell_id(r+1, c))
                }
                // left
                if (c>0 && !reached_cell.has(this.rc_to_cell_id(r, c-1)) ){ 
                    available_neighbors.push(this.rc_to_cell_id(r, c-1))
                }
                // right
                if (c<this.coln-1 && !reached_cell.has(this.rc_to_cell_id(r, c+1)) ){ 
                    available_neighbors.push(this.rc_to_cell_id(r, c+1))
                }

                if(available_neighbors.length == 0){
                    no_space = true;
                }else{
                    var next_cell = available_neighbors[Math.floor(Math.random() * available_neighbors.length)];

                    this.connnect_neighbors(current_cell, next_cell);

                    this.parent[next_cell] =  current_cell;
                    select_pool.add(next_cell);
                    reached_cell.add(next_cell);
                    current_cell = next_cell;
                }
            }
        }

    }

    // shift origin, require to have a perfect maze before
    shift_origin(times?: number){
        if (typeof times === "undefined") {    
            times = 1
        }
        for(let i: number = 0; i<= times; i++){
            var end_cell_id = this.rc_to_cell_id(this.end_point_r, this.end_point_c);
            var available_neighbors: number[] = [];
            // up
            if(this.end_point_r > 0){
                available_neighbors.push(end_cell_id - this.coln);
            }
            // down
            if(this.end_point_r < this.rown - 1){
                available_neighbors.push(end_cell_id + this.coln);
            }
            // left
            if(this.end_point_c > 0){
                available_neighbors.push(end_cell_id - 1);
            }
            // right
            if(this.end_point_c < this.coln - 1){
                available_neighbors.push(end_cell_id + 1);
            }
    
            var new_end_cell_id = available_neighbors[
                Math.floor(Math.random() * available_neighbors.length)
            ];
    
            // remove new end parent
            var new_end_parent = this.parent[new_end_cell_id];
            this.disconnnect_neighbors(new_end_parent, new_end_cell_id);
            this.parent[new_end_cell_id] = -1;
    
            // add new end to end parent and connect them
            this.parent[end_cell_id] = new_end_cell_id;
            this.connnect_neighbors(new_end_cell_id, end_cell_id);
    
            // update new end
            [this.end_point_r, this.end_point_c] = this.cell_id_to_rc(new_end_cell_id);
        }
        
    }

    // find solution from the player's position to the end point instead of start point
    find_solution(): [number, number][]{
        var path_rc: [number, number][] = [];
        var current_cell_id = this.rc_to_cell_id(this.player_r, this.player_c);
        var end_cell_id = this.rc_to_cell_id(this.end_point_r, this.end_point_c);
        while(current_cell_id != end_cell_id){
            path_rc.push(this.cell_id_to_rc(current_cell_id));
            current_cell_id = this.parent[current_cell_id];
        }
        return path_rc;
    }

    reGen(){
        this.maze = new Array(this.rown).fill(null)
            .map(() => new Array(this.coln).fill(0b1111));
        [this.end_point_r, this.end_point_c] = this.pick_random_point();
        this.parent = new Array(this.rown * this.coln).fill(-1);

        this.generate();
        this.pick_start_cell();

        this.player_r = this.start_point_r;
        this.player_c = this.start_point_c;

        this.status = Status.IN_PROGRESS;
    }

    game_over(){
        return this.status == Status.FINISHED;
    }
}


