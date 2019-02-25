'use strict';

const Grid = require('./Structs.js');

const height = 1;
const width = 3;

const play = new Grid(height, width);
let playText = '';
for (const tile of play.tiles) {
  // console.log(tile);
  playText += `${tile.letter} `;
}
console.log(playText);
