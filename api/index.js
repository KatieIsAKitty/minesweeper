'use strict';

const crypto = require('crypto');
const sql = require('sqlite');
const { createServer, get } = require('http');
const Grid = require('./Structs');

const hexBytes = Array.from({ length: 256 }, (_, i) => (i + 0x100).toString(16).substr(1));
const safetyRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

let db = sql.open('grids.sqlite');

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
  return { overlay: playText, underlay: hidden };
}

const server = createServer(async (req, res) => {
  const params = new URL(req.url, 'http://example.com/').searchParams;
  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('you did a bad, try again');
    return;
  }
  if (params.get('grid')) {
    if (!safetyRegex.test(params.get('grid'))) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end('Did you really just try to sql inject me? Get the fuck outta here');
    }
    const resp = await db.get(`SELECT grid,state FROM grids WHERE id="${params.get('grid')}"`);
    // console.log(resp);
    const vars = resp.grid.split(';');
    const grid = { overlay: [], underlay: [] };

    let lines = vars[0].split(',');
    for (let i = 0; i < lines.length; i += 1) {
      grid.overlay.push(lines[i].split('.'));
    }
    lines = vars[1].split(',');
    for (let i = 0; i < lines.length; i += 1) {
      grid.underlay.push(lines[i].split('.'));
    }

    // console.log(grid.overlay);
    if (params.get('x') && params.get('y')) {
      grid.overlay[params.get('y')][params.get('x')] = grid.underlay[params.get('y')][params.get('x')];

      const complete = grid.overlay.every((row, i) => row.every((x, j) => !(grid.underlay[i][j] !== 'M' && x === '■'))) ? 1 : 0;
      // console.log(`y${i}: ${grid.underlay[i][j]}, x${j}: ${x}, ${grid.underlay[i][j] !== 'M' && x === '■'}`);
      console.log(complete);
      let outstr = '';
      for (let line = 0; line < grid.overlay.length; line += 1) {
        outstr += grid.overlay[line].join('.');
        if (line !== grid.overlay.length - 1) {
          outstr += ',';
        }
      }
      outstr += ';';
      for (let line = 0; line < grid.underlay.length; line += 1) {
        outstr += grid.underlay[line].join('.');
        if (line !== grid.underlay.length - 1) {
          outstr += ',';
        }
      }
      await db.run(`UPDATE grids SET grid="${outstr}" WHERE id="${params.get('grid')}"`);
      await db.run(`UPDATE grids SET state="${complete}" WHERE id="${params.get('grid')}"`);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({ overlay: grid.overlay, complete }));
      return;
    }

    if (resp === undefined) {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = '404';
      res.statusMessage = 'Not found';
      res.end('No game with that ID was found');
      return;
    }

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({ overlay: grid.overlay, complete: resp.state }));
    return;
  }
  if (params.get('h') && params.get('w')) {
    const id = uuidv4();
    const grid = newGame(params.get('h'), params.get('w'));
    let outstr = '';
    for (let line = 0; line < grid.overlay.length; line += 1) {
      outstr += grid.overlay[line].join('.');
      outstr += ',';
    }
    outstr += ';';
    for (let line = 0; line < grid.underlay.length; line += 1) {
      outstr += grid.underlay[line].join('.');
      outstr += ',';
    }
    await db.run(`INSERT INTO grids VALUES ("${id}", ?, false)`, outstr);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(id);
    return;
  }
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end('you did a bad, try again');
});

server.listen({ port: 8081, host: '127.0.0.1' });
server.on('listening', async () => {
  db = await db;
  await db.run('CREATE TABLE IF NOT EXISTS grids (id TEXT, grid TEXT, state TEXT)');
  get('http://127.0.0.1/grid?grid=1');
});
// eslint-disable-next-line no-console
process.on('unhandledRejection', console.error);
