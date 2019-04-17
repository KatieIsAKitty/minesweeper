'use strict';

const sql = require('sqlite');
const { createServer, get } = require('http');
const { readFile } = require('fs');
const { newGame, uuidv4 } = require('../node/index');

let db = sql.open('grids.sqlite');

const server = createServer(async (req, res) => {
  const params = new URL(req.url, 'http://example.com/').searchParams;
  console.log(req.url);
  if (params.get('grid')) {
    const resp = await db.get(`SELECT grid FROM grids WHERE id="${params.get('grid')}"`);
    // If the request is to update the playing field
    if (params.get('x') && params.get('y') && params.get('action')) {
      const grid = JSON.parse(resp.grid);
      // To keep track of what tiles are modified so that victory is possible
      grid.overlay[params.get('y')[params.get('x')]] = grid.underlay[params.get('y')[params.get('x')]];
      await db.run(`UPDATE INTO grids VALUES ("${params.get('grid')}", ?)`, JSON.stringify(grid));
      res.setHeader('Content-Type', 'text/html');
      // Send only the tile that was updated
      res.end(grid.overlay[params.get('y')[params.get('x')]]);
    }

    if (resp === undefined) {
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = '404';
      res.statusMessage = 'Not found';
      res.end('No game with that ID was found');
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end();
    return;
  }
  if (params.get('h') && params.get('w')) {
    const id = uuidv4();
    const grid = newGame(params.get('h'), params.get('w'));
    await db.run(`INSERT INTO grids VALUES ("${id}", ?)`, JSON.stringify(grid));
    res.writeHead(302, {
      Location: `/?grid=${id}`,
    });
    res.end();
    return;
  }
  if (req.url === '/css/style.css') {
    try {
      const css = await readFile('../browser/css/style.css');
      res.setHeader('Content-Type', 'text/css');
      res.end(css);
    } catch (e) {
      res.setHeader('Content-Type', 'text/html');
      res.end('I did a bad, try again later');
    }
    return;
  }
  if (req.url.startsWith('/resources/')) {
    try {
      const image = await readFile(`../browser${req.url}`);
      res.setHeader('Content-Type', 'image/png');
      res.end(image);
    } catch (e) {
      res.setHeader('Content-Type', 'text/html');
      res.end('I did a bad, try again later');
    }
    return;
  }
  res.setHeader('Content-Type', 'text/html');
  res.end('you did a bad, try again');
});

server.listen({ port: 8080, host: '127.0.0.1' });
server.on('listening', async () => {
  db = await db;
  console.log(db);
  await db.run('CREATE TABLE IF NOT EXISTS grids (id TEXT, grid TEXT, state TEXT)');
  get('http://127.0.0.1/grid?grid=1');
  console.log(server.address());
});

process.on('unhandledRejection', console.error);
