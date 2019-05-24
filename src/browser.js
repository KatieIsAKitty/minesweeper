/* eslint-disable no-undef */

'use strict';

const spyElement = document.getElementById('main');
spyElement.onmousedown = (event) => {
  const params = new URL(window.location.href).searchParams;
  const x = parseInt(event.target.id.replace(/x|(y\d+)/g, ''), 10);
  const y = parseInt(event.target.id.replace(/y|(x\d+)/g, ''), 10);
  if (!(x >= 0)) {
    return;
  }
  if (event.button === 0) {
    if (event.target.className === 'play-flagged') {
      return;
    }
    fetch(`http://${window.location.hostname}:${window.location.port}/grid?x=${x}&y=${y}&grid=${params.get('grid')}`, { mode: 'no-cors' })
      .then((r) => {
        r.json().then((lines) => {
          const clicked = document.getElementById(`x${x}y${y}`);
          console.log(lines.updated);
          let cclass;
          if (lines.updated === 'M') {
            cclass = 'mine';
          } else if (lines.updated === 'F') {
            cclass = 'flagged';
          } else if (lines.updated === 'N') {
            cclass = 'empty';
          } else if (!Number.isNaN(parseInt(lines.updated, 10))) {
            cclass = lines.updated;
          } else {
            cclass = 'hidden';
          }
          clicked.className = `play-${cclass}`;

          if (lines.complete === 1) {
            // eslint-disable-next-line
            if (confirm('You won! Click "Ok" to play again with a 10x10 grid.')) {
              window.location.href = '/play?w=10&h=10&m=10';
            }
            return;
          }
          if (lines.updated === 'M') {
            // eslint-disable-next-line
            if (confirm('You lost! Click "Ok" to play again with a 10x10 grid.')) {
              window.location.href = '/play?w=10&h=10&m=10';
            }
          }
        });
      });
  } else if (event.button === 2) {
    event.preventDefault();
    if (event.target.className === 'play-flagged') {
      event.target.className = 'play-hidden';
      return;
    }
    if (event.target.className === 'play-hidden') {
      event.target.className = 'play-flagged';
    }
  }
};
document.addEventListener('contextmenu', (event) => event.preventDefault());
