class Tile {
  constructor(pos, grid) {
    this.position = pos;
    this.grid = grid;
  }

  get adjacent() {
    const { tiles } = this.grid;
    return tiles.find((tile) => (tile.x !== this.pos.x && tile.y !== this.pos.y)
      && (Math.abs(this.pos.x - tile.x) === 1
      || Math.abs(this.pos.y - tile.y) === 1));
  }
}

class Grid {
  constructor(height, width) {
    for (let x = 0; x < width; x += 1) {
      for (let y = 0; y < height; y += 1) {
        const type = Math.floor(Math.random() * 3);
        const tile = new Tile({ x, y });
        this.tiles.push({ x, y, type, tile });
      }
    }
  }
}

export default Grid;
