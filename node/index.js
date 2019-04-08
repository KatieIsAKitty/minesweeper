'use strict';

const Grid = require('./Structs');

const height = 10;
const width = 10;

const play = new Grid(height, width);
const playText = [];
const hidden = [];
const lines = [];
for (let i = 0; i < height; i += 1) {
  lines[i] = [];
  hidden[i] = [];
  playText[i] = [];
}
for (const tile of play.tiles) {
  lines[tile.position.y].push(tile);
}
for (const line of lines) {
  for (const tile of line) {
    playText[tile.position.y].push('■');
    hidden[tile.position.y].push(tile.letter);
  }
}
console.log(playText.map((line) => line.join(' ')).join('\n')); // eslint-disable-line no-console
