'use strict';

const { createServer } = require('http');
const { createReadStream } = require('fs');
const crypto = require('crypto');
const sql = require('sqlite');
const Grid = require('./Structs');
const config = require('./config');

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

function newGame(height = 10, width = 10, mines = 10) {
  const uuid = uuidv4();
  const play = new Grid(height, width, uuid, mines);
  const playText = [];
  const hidden = [];
  const lines = [];
  for (let i = 0; i < height; i += 1) {
    lines[i] = [];
    hidden[i] = [];
    playText[i] = [];
  }
  for (const tile of play.tiles) {
    lines[tile.position.y][tile.position.x] = tile;
  }
  for (const line of lines) {
    for (const tile of line) {
      playText[tile.position.y].push('■');
      hidden[tile.position.y].push(tile.letter);
    }
  }
  return { overlay: playText, underlay: hidden };
}

async function genPage(playgrid) {
  // console.log(playgrid);
  let page = '<html><head><link rel="stylesheet" href="/css/style.css"></head><body><div id="main"><script src="/browser.js"></script>';
  for (let y = 0; y < playgrid.length; y += 1) {
    page += `<div class="row-${y}">`;
    for (let x = 0; x < playgrid[y].length; x += 1) {
      if (playgrid[y][x] !== '') {
        let cclass;

        if (playgrid[y][x] === 'M') {
          cclass = 'mine';
        } else if (playgrid[y][x] === 'F') {
          cclass = 'flagged';
        } else if (playgrid[y][x] === 'N') {
          cclass = 'empty';
        } else if (!Number.isNaN(parseInt(playgrid[y][x], 10))) {
          cclass = playgrid[y][x];
        } else {
          cclass = 'hidden';
        }
        page += `<div class="play-${cclass}" id="x${x}y${y}"></div>`;
      }
    }
    page += '</div>\n';
  }
  page += '</div>';
  return page;
}

const server = createServer(async (req, res) => {
  const params = new URL(req.url, 'http://example.com/').searchParams;
  // console.info(req.url);
  if (req.url === '/css/style.css') {
    try {
      createReadStream(`.${req.url}`).pipe(res);
    } catch (e) {
      // console.error(e);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = '502';
      res.statusMessage = 'Internal server error';
      res.end('I did a bad, try again later');
    }
    return;
  }
  if (req.url.startsWith('/images/')) {
    try {
      createReadStream(`.${req.url}`).pipe(res);
    } catch (e) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = '404';
      res.statusMessage = 'Not found';
      res.end('Image probably doesn\'t exist');
    }
    return;
  }
  if (req.url === '/browser.js') {
    try {
      createReadStream(`.${req.url}`).pipe(res);
    } catch (e) {
      // console.error(e);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = '502';
      res.statusMessage = 'Internal server error';
      res.end('I did a bad, try again later');
    }
    return;
  }

  if (params.get('h') && params.get('w')) {
    if (!/[0-9]+/.test(params.get('h')) || !/[0-9]+/.test(params.get('w'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/html');
      res.end('that\'s a Number, moron');
      return;
    }
    const id = uuidv4();
    const grid = newGame(params.get('h'), params.get('w'), params.get('m') ? params.get('m') : params.get('h') * params.get('w') / 4);
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
    res.writeHead(302, {
      Location: `/?grid=${id}`,
    });
    res.end();
    return;
  }
  if (params.get('grid')) {
    if (!safetyRegex.test(params.get('grid'))) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/html');
      res.end('Did you really just try to sql inject me? Get the fuck outta here');
      return;
    }
    const resp = await db.get(`SELECT grid,state FROM grids WHERE id="${params.get('grid')}"`);
    if (resp === undefined) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = '404';
      res.statusMessage = 'Not found';
      res.end('No game with that ID was found');
      return;
    }
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

    if (params.get('x') && params.get('y')) {
      grid.overlay[params.get('y')][params.get('x')] = grid.underlay[params.get('y')][params.get('x')];

      const complete = grid.overlay.every((row, i) => row.every((x, j) => !(grid.underlay[i][j] !== 'M' && x === '■'))) ? 1 : 0;
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
      res.end(JSON.stringify({ updated: grid.underlay[params.get('y')][params.get('x')], complete }));
      return;
    }

    // console.log(`grid: ${grid}`);
    const playG = await genPage(grid.overlay);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/html');
    res.end(playG);
  }
});

server.listen({ port: config.port, host: config.ip });
server.on('listening', async () => {
  db = await db;
  await db.run('CREATE TABLE IF NOT EXISTS grids (id TEXT, grid TEXT, state TEXT)');
});
