export enum Direction {
    UP = 3,
    DOWN = 2,
    LEFT = 1,
    RIGHT = 0,
}

enum Status {
    PREPARING,
    IN_PLAY,
    FINISHED
}

/**
 * The core Maze game. Need to generate maze by calling createMaze for immedate 
 * creation or mazeGenerator to get a maze generator so can generate maze one 
 * step a time.
 */
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

    coins_pos: number[]; // list of the coins position in cell id
    coin_amount: number;

    /**
     * generate a new maze game without maze generation. Need to generate maze
     * by calling createMaze for immediate creation or mazeGenerator to get a 
     * maze generator so can generate maze one step a time.
     * @param  {number} rown The row number of the maze
     * @param  {number} coln The column bumber of the maze
     */
    constructor(rown: number, coln: number){
        this.rown = rown;
        this.coln = coln;
        // this.solution_path = [];
        this.parent = new Array(rown * coln).fill(-1);
        this.maze = new Array(rown).fill(null)
            .map(() => new Array(coln).fill(0b1111));
        this.status = Status.PREPARING;
        this.coins_pos = [];
        // comfirm end point first and after created maze, pick a random 
        // start cell
        // so that all cells can follow their parent to reach end point

        // pick start point
        //[this.start_point_r, this.start_point_c] = this.pick_random_point();
    }

    /**
     * generate maze immediately 
     */
    createMaze(){
        [this.end_point_r, this.end_point_c] = this.pick_random_point();
        this.maze = new Array(this.rown).fill(null)
            .map(() => new Array(this.coln).fill(0b1111));
        [this.end_point_r, this.end_point_c] = this.pick_random_point();
        this.parent = new Array(this.rown * this.coln).fill(-1);

        var gen = this.generate();
        var res = gen.next();
        while(!res.done){
            res = gen.next();
        }
        this.pick_start_cell();

        this.player_r = this.start_point_r;
        this.player_c = this.start_point_c;
        var coin_amount_in_maze = Math.floor(Math.random()*3) + 1;
        this.put_coins(coin_amount_in_maze);

        this.status = Status.IN_PLAY;
    }

    /**
     * move player towward the given direction. Player moves until reach 
     * next branch
     * @param {Direction} direction the direction the player moves toward
     * @returns {boolean} true if player moved successfully otherwise false
     */
    move_player(direction: Direction): boolean{
        if(this.status != Status.IN_PLAY){
            return false;
        }
        var r = this.player_r;
        var c = this.player_c;
        var moved = false;
        if(direction == Direction.UP){
            if(r>0 && (this.maze[r][c]>>3) % 2 == 0){
                r = r - 1;
                while(r>0 && (this.maze[r][c] == 0b0011) 
                    && (r != this.end_point_r || c != this.end_point_c)
                ){
                    r = r - 1;
                }
                this.player_r = r;
                moved = true;
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
                moved = true;
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
                moved = true;
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
                moved = true;
            }
        }
        this.check_player_n_coin();
        if(this.player_r == this.end_point_r && 
            this.player_c == this.end_point_c){
            this.status = Status.FINISHED;
        }
        return moved;
    }

    /**
     * convert cell id to its row number and column number
     * @param {number} id the id of the cell in the maze
     * @returns {[number, number]} the first number indicates the row index and 
     * the second number indicates the column index
     */
    cell_id_to_rc(id: number): [number, number]{
        var r = Math.floor(id / this.coln);
        var c = id % this.coln;
        return [r, c]
    }

    /**
     * convert row and column number to cell id
     * @param {number} r the row index of the cell 
     * @param {number} c the columb index of the cell
     * @returns {number} the cell id
     */
    rc_to_cell_id(r: number, c: number): number{
        return r*this.coln + c;
    } 
 
    /**
     * pick a random cell in the maze and return its row and column index
     * @returns {[number, number]} the row index and column index of the 
     * picked cell 
     */
    pick_random_point(): [number, number]{
        var id = Math.floor(Math.random()*this.rown * this.coln);
        return this.cell_id_to_rc(id)
    }

    /**
     * update the cell value so the wall face the given direction is removed
     * @param {number} original_wall_value the cell value indicates the walls 
     * of the cell
     * @param {Direction} direction remove the wall on this direction 
     * @returns {number} the updated cell value
     */
    remove_wall(original_wall_value: number, direction: Direction): number{
        return (original_wall_value ^ (1 << direction));
    }
    
    /**
     * update the cell value so the wall face the given direction is set
     * @param {number} original_wall_value the cell value indicates
     * @param {Direction} direction 
     * @returns {number}
     */
    set_wall(original_wall_value: number, direction: Direction): number{
        return (original_wall_value | (1 << direction));
    }

    /**
     * connect two neighbor cells in the maze by remove the wall between. Two 
     * cells have to be neighbors.
     * @param {number} cellA_id one of the cell
     * @param {number} cellB_id another cell
     */
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

    /**
     * disconnect two neighbor cells in the maze by remove the wall between. 
     * Two cells have to be neighbors.
     * @param {number} cellA_id one of the cell
     * @param {number} cellB_id another cell
     */
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

    /**
     * find the depth of the a cell which is the distance of this cell to the 
     * end point. This function is recursive! All the parents' depth will be 
     * stored in the depth array.
     * @param {number} cell_id the id of the cell to find depth
     * @param {number} depth the depth map of the maze as all cells' depth is 
     * stored in this array with their id as index
     * @returns {number} the distance from the cell to the end point
     */
    find_depth(cell_id: number, depth: number[]): number{
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

    /**
     * pick the start cell for the maze. This is where the player initially 
     * spawned. It will try to prevent the start cell being too close to the 
     * end point
     */
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

    /**
     * A generator for the maze generation. It will randomly pick an algorithm 
     * to generate the maze.
     * @yields {number} the percentage of the maze generation
     */
    *generate(): Generator<number, number, any>{
        [this.end_point_r, this.end_point_c] = this.pick_random_point();
        this.maze = new Array(this.rown).fill(null)
            .map(() => new Array(this.coln).fill(0b1111));
        [this.end_point_r, this.end_point_c] = this.pick_random_point();
        this.parent = new Array(this.rown * this.coln).fill(-1);


        [this.end_point_r, this.end_point_c] = this.pick_random_point();
        console.log('start gen')
        var i = Math.floor(Math.random()*3);
        if(i == 0){
            this.algorithm = "Growing Tree";
            var gen = this.generate_by_growing_tree();
            var res = gen.next();
            while(!res.done){
                res = gen.next();
                yield res.value;
            }
        }else if(i == 1){
            this.algorithm = "DFS + Shift Origin 1000";
            var gen = this.generate_by_DFS();
            var res = gen.next();
            while(!res.done){
                res = gen.next();
                yield res.value * 0.8;
            }
            for(var i = 0; i < 100; i++){
                this.shift_origin(10);
                yield 0.8 + (i / 10) * 0.2 ;
            }
        }else{
            this.algorithm = "Prim's";
            var gen = this.generate_by_Prim();
            var res = gen.next();
            while(!res.done){
                res = gen.next();
                yield res.value;
            }
        }
        this.pick_start_cell();

        this.player_r = this.start_point_r;
        this.player_c = this.start_point_c;

        var coin_amount_in_maze = Math.floor(Math.random()*3) + 1;
        this.put_coins(coin_amount_in_maze);
        console.log(this.get_coins_pos());

        this.status = Status.IN_PLAY;
        return 1;
    }

    // use DFS to generate maze
    // and try generate end cell after depth > (rown + coln) * 2 if failed, 
    // then pick a random cell
    // problem: the main path doesn't have enough branches
    *generate_by_DFS(): Generator<number, number, any>{
        var currentPath: number[] = [this.rc_to_cell_id(
            this.end_point_r, this.end_point_c
        )];
        var reached: number[] = [this.rc_to_cell_id(
            this.end_point_r, this.end_point_c
        )];
        //var max_depth = depth; // for debug
        while(reached.length < this.rown * this.coln){
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
            yield reached.length / (this.rown * this.coln);
        }
        return 1;
    }

    // use Prim's algorithm to generate maze
    // problem: maze too easy, not enough tortuous
    *generate_by_Prim(): Generator<number, number, any>{
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
            yield reached.size / (this.rown * this.coln);
        }
        return 1;
    }

    *generate_by_growing_tree(branch_length: number = 4): Generator<number, number, any>{
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
                if (
                    r > 0 
                    && !reached_cell.has(this.rc_to_cell_id(r - 1, c)) 
                ){
                    available_neighbors.push(this.rc_to_cell_id(r - 1, c))
                }
                // down
                if (
                    r < this.rown - 1 
                    && !reached_cell.has(this.rc_to_cell_id(r + 1, c)) 
                ){ 
                    available_neighbors.push(this.rc_to_cell_id(r + 1, c))
                }
                // left
                if (
                    c > 0 
                    && !reached_cell.has(this.rc_to_cell_id(r, c - 1)) 
                ){ 
                    available_neighbors.push(this.rc_to_cell_id(r, c - 1))
                }
                // right
                if (
                    c < this.coln-1 
                    && !reached_cell.has(this.rc_to_cell_id(r, c + 1)) 
                ){ 
                    available_neighbors.push(this.rc_to_cell_id(r, c + 1))
                }

                if(available_neighbors.length == 0){
                    no_space = true;
                }else{
                    var next_cell = available_neighbors[
                        Math.floor(Math.random() * available_neighbors.length)
                    ];
                    this.connnect_neighbors(current_cell, next_cell);

                    this.parent[next_cell] = current_cell;
                    select_pool.add(next_cell);
                    reached_cell.add(next_cell);
                    current_cell = next_cell;
                }
                yield reached_cell.size / (this.rown * this.coln);
            }
        }
        return 1;
    }

    /**
     * shift the origin(the end point) of the maze by times given
     * @param {number} times indicates how many times the origin will be shifted
     */
    shift_origin(times: number = 1){
        for(let i: number = 0; i< times; i++){
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

    /**
     * Find the path from the player's position to the end point
     * @returns {[number, number][]} An array of coordinates shows the path 
     * from the player's position to the end point
     */
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

    /**
     * Put coins in the maze at random positions
     * @param {number} coinNumber the amount of coins to put in the maze, 
     * default is one
     */
    put_coins(coinNumber: number = 1){
        for(var i = 0; i<coinNumber; i++){
            var pos = this.pick_random_point();
            var cell_id = this.rc_to_cell_id(pos[0], pos[1]);
            this.coins_pos.push(cell_id);
        }
    }

    /**
     * Get the positions of all coins 
     * @returns {[number, number][]} an array of position of all coins
     */
    get_coins_pos(){
        var coins_p:[number, number][] = [];
        this.coins_pos.map((id) => {
            coins_p.push(this.cell_id_to_rc(id));
        });
        return coins_p;
    }

    /**
     * Check if there is a coin at player's position. If there is, remove the 
     * coin and add 1 to this coin amount
     */
    check_player_n_coin(){
        var player_pos = this.rc_to_cell_id(this.player_r, this.player_c);
        var index = this.coins_pos.indexOf(player_pos);
        if (index != -1){
            this.add_coin();
            this.coins_pos.splice(index);
        }
    }

    /**
     * Add coins to player. Will ignore when amount is a negative number
     * @param {number} amount the amount of coins to add, default is 1 
     */
    add_coin(amount: number = 1){
        if(amount > 0){
            this.coin_amount += amount;
        }
    }

    /**
     * Spend the amount of coins
     * @param {number} amount spend this amount of coins
     * @returns {boolean} true if successfully spent the coins, otherwise false
     */
    spend_coin(amount: number): boolean{
        if(amount < 0) { return false; }
        if(amount > this.coin_amount) { return false; }
        this.coin_amount -= amount;
        return true;
    }

    /**
     * To check if the game is finished.
     * @returns {boolean} true if the game is finished otherwise false
     */
    game_over(){
        return this.status == Status.FINISHED;
    }
}


