/* eslint-disable no-console */

'use strict';

class Tile {
  constructor(pos, grid, type) {
    this.position = pos;
    this.grid = grid;
    this.type = type;
  }

  get adjacent() {
    const { tiles } = this.grid;
    console.log(`adjacent called for ${this.position.x}/${this.position.y}`);
    return tiles.filter((tile) => {
      const ret = ((
        tile.position.x !== this.position.x
        && tile.position.y !== this.position.y
      )
      && (
        Math.abs(this.position.x - tile.position.x) <= 1
        && Math.abs(this.position.y - tile.position.y) <= 1
      ));
      console.log(`tile ${tile.position.x}/${tile.position.y} ${ret ? 'is' : 'is not'} adjacent to ${this.position.x}/${this.position.y}`);
      return ret;
    });
  }

  get letter() {
    if (this.type === 1) {
      console.log(`${this.position.x}/${this.position.y} is a mine`);
      return 'M';
    }
    const adj = this.adjacent;
    const mines = adj.filter((tile) => tile.type === 1);
    if (mines.length <= 0) {
      console.log(`${this.position.x}/${this.position.y} is not a mine and none are near`);
      return 'N';
    }
    if (mines.length >= 1) {
      console.log(`${this.position.x}/${this.position.y} is not a mine with mines nearby`);
      return mines.length.toString();
    }
    throw new Error(`Invalid tile type ${this.type}`);
  }
}

class Grid {
  constructor(height, width) {
    this.tiles = [];
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        const type = Math.floor(Math.random() * 2);
        const tile = new Tile({ x, y }, this, type);
        this.tiles.push(tile);
      }
    }
  }
}

module.exports = Grid;
