enum Direction {
    Up = 3,
    Down = 2,
    Left = 1,
    Right = 0,
}

export class Maze{
    maze: number[][];
    rown: number;
    coln: number;
    start_point_r: number;
    start_point_c: number;
    end_point_r: number;
    end_point_c: number;

    constructor(rown: number, coln: number){
        this.rown = rown;
        this.coln = coln;
        this.maze = new Array(rown).fill(null)
            .map(() => new Array(coln).fill(0b1111));
        [this.start_point_r, this.start_point_c] = this.pick_random_point();
        [this.end_point_r, this.end_point_c] = this.pick_random_point();

        this.generate();
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
                this.maze[A_r][A_c], Direction.Down
            );
            this.maze[B_r][B_c] = this.remove_wall(
                this.maze[B_r][B_c], Direction.Up
            );
        }
        else if(A_r == B_r){ // B on the right A
            this.maze[A_r][A_c] = this.remove_wall(
                this.maze[A_r][A_c], Direction.Right
            );
            this.maze[B_r][B_c] = this.remove_wall(
                this.maze[B_r][B_c], Direction.Left
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
}


