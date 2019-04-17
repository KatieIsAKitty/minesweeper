'use strict';

class Tile {
  constructor(pos, grid, type) {
    this.position = pos;
    this.grid = grid;
    this.type = type;
  }

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

class Grid {
  constructor(height = 10, width = 10, id = 0) {
    this.tiles = [];
    this.id = id;
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        const type = Math.random() < 0.8 ? 0 : 1;
        const tile = new Tile({ x, y }, this, type);
        this.tiles.push(tile);
      }
    }
  }
}

module.exports = Grid;
