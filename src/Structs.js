'use strict';

/**
 * @typedef {import('./Structs').Tile} Tile
 */

class Tile {
  /**
   * @param {object} pos The position of the tile within the parent grid
   * @param {Grid} grid The parent grid
   * @param {number} type The integer representing this tile as a mine or non-mine
   */
  constructor(pos, grid, type) {
    this.position = pos;
    this.grid = grid;
    this.type = type;
  }

  /**
   * @returns {Array} The list of tiles this tile takes into account when calculating mines
   */
  get adjacent() {
    const { tiles } = this.grid;
    return tiles.filter((tile) => {
      if (tile.position.x === this.position.x && tile.position.y === this.position.y) {
        return false;
      }
      return (Math.abs(this.position.x - tile.position.x) <= 1
        && Math.abs(this.position.y - tile.position.y) <= 1);
    });
  }

  get letter() {
    if (this.type === 1) {
      return 'M';
    }
    const adj = this.adjacent;
    const mines = adj.filter((tile) => tile.type === 1);
    if (mines.length <= 0) {
      return 'N';
    }
    if (mines.length >= 1) {
      return mines.length.toString();
    }
    throw new Error(`Invalid tile type ${this.type}`);
  }
}

/**
 * @typedef {import('./Structs').Grid} Grid
 */

class Grid {
  /**
   * @param {number} height The height of the grid
   * @param {number} width The width of the grid
   * @param {string} id The uuID of the grid
   * @param {number} mines The number of mines in the grid
   * @returns {Grid} The generated grid
   */
  constructor(height, width, id, mines) {
    this.tiles = [];
    this.id = id;
    this.height = Math.min(height, 100);
    this.width = Math.min(width, 100);
    this.height = Math.max(height, 2);
    this.width = Math.max(width, 2);
    this.mines = Math.min(Math.round(this.width * this.height / mines),
      Math.round(this.width * this.height / 2));
    this.populate();
    // console.log(`mines: ${this.mines}`);
    this.tiles = this.tiles.sort((t1, t2) =>
      ((width * t1.position.y) + t1.position.x) - ((width * t2.position.y) + t2.position.x));
    // console.log(this.tiles.filter((tile) => tile.type === 1).map((tile) => tile.pos))
  }

  populate() {
    const coords = [];
    while (coords.length < this.mines) {
      const rx = Math.floor(Math.random() * this.width);
      const ry = Math.floor(Math.random() * this.height);
      if (!coords.find((coord) => coord.rx === rx && coord.ry === ry)) {
        coords.push({ rx, ry });
      }
    }
    console.log(coords);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        let type = 0;
        if (coords.some((coord) => coord.rx === x && coord.ry === y)) {
          // console.log(`tile ${x},${y} is a mine`);
          type = 1;
        }
        const tile = new Tile({ x, y }, this, type);
        this.tiles.push(tile);
      }
    }
  }
}

module.exports = Grid;
