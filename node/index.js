'use strict';

const crypto = require('crypto');
const Grid = require('./Structs');

const hexBytes = Array.from({ length: 256 }, (_, i) => (i + 0x100).toString(16).substr(1));

function uuidv4() {
  const b = crypto.randomFillSync(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  return `${hexBytes[b[0]] + hexBytes[b[1]] + hexBytes[b[2]] + hexBytes[b[3]]}-${hexBytes[b[4]]}${hexBytes[b[5]]}-${
    hexBytes[b[6]]}${hexBytes[b[7]]}-${hexBytes[b[8]]}${hexBytes[b[9]]}-${hexBytes[b[10]]}${hexBytes[b[11]]}${
    hexBytes[b[12]]}${hexBytes[b[13]]}${hexBytes[b[14]]}${hexBytes[b[15]]}`;
}

function newGame(height, width) {
  const uuid = uuidv4();
  const play = new Grid(height, width, uuid);
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
  return { overlay: playText, underlay: hidden };
}

module.exports = { newGame, uuidv4 };
