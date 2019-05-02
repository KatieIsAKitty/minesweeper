'use strict';

const { get, createServer } = require('http');
const { readFile } = require('fs').promises;
const { createReadStream } = require('fs');
const config = require('./config');

async function genPage(playgrid) {
  console.log(playgrid);
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
  console.info(req.url);
  if (req.url === '/css/style.css') {
    try {
      const css = await readFile('./css/style.css');
      res.setHeader('Content-Type', 'text/css');
      res.end(css);
    } catch (e) {
      console.error(e);
      res.setHeader('Content-Type', 'text/html');
      res.end('I did a bad, try again later');
    }
    return;
  }
  if (req.url.startsWith('/images/')) {
    try {
      createReadStream(`.${req.url}`).pipe(res);
    } catch (e) {
      res.setHeader('Content-Type', 'text/html');
      res.end('Image probably doesn\'t exist');
    }
    return;
  }
  if (req.url.startsWith('/play')) {
    try {
      if (params.get('grid')) {
        get(`${config.api}/grid?grid=${params.get('grid')}`, async (chunks) => {
          let grid = '';
          for await (const chunk of chunks) {
            grid += chunk;
          }
          grid = JSON.parse(grid);
          console.log(`grid: ${grid}`);
          const playG = await genPage(grid.overlay);
          res.setHeader('Content-Type', 'text/html');
          res.end(playG);
        });
        return;
      }
      if (params.get('h') && params.get('w')) {
        get(`${config.api}/grid?h=${params.get('h')}&w=${params.get('w')}`, async (chunks) => {
          let body = '';
          for await (const chunk of chunks) {
            body += chunk;
          }
          res.writeHead(302, {
            Location: `/play/?grid=${body}`,
          });
          res.end();
        });
        return;
      }
      res.setHeader('Content-Type', 'text/html');
      res.end('please specify ?h=height&w=width or ?grid=gridID');
      return;
    } catch (e) {
      console.error(e);
      res.setHeader('Content-Type', 'text/html');
      res.end('I did a bad, try again later');
    }
    return;
  }
  if (req.url === '/browser.js') {
    try {
      const css = await readFile('./browser.js');
      res.setHeader('Content-Type', 'text/javascript');
      res.end(css);
    } catch (e) {
      console.error(e);
      res.setHeader('Content-Type', 'text/html');
      res.end('I did a bad, try again later');
    }
    return;
  }
  res.setHeader('Content-Type', 'text/html');
  res.statusCode = '404';
  res.statusMessage = 'Not found';
  res.end('Error 404');
});
server.listen({ port: config.port, host: config.ip });
server.on('listening', async () => {
  console.info(server.address());
});
