import { Doc, SIMPLE_TEXT } from './doc';
import './style.css'
import $ from 'jquery';
// const app = document.querySelector<HTMLDivElement>('#app')!

// app.innerHTML = `
//   <h1>Hello Vite!</h1>
//   <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
// `;

// https://www.catch22.net/tuts/neatpad/loading-text-file#


const canvas = $('#canvas');

// const c = document.querySelector("canvas");
const text_area = $("#hiddenTextArea");

// const c = $('canvas'),text_area = $('#hiddenTextArea');

// const dpr = Math.max(1,window.devicePixelRatio || 1);


// const ctx = c[0].getContext("2d");
const ctx = (<HTMLCanvasElement>canvas[0]).getContext('2d');
// console.log(window.devicePixelRatio)
// ctx.save();
// ctx.strokeStyle = 'gray';
// ctx.strokeRect(0, 0, c.width, c.height);
// ctx.restore();



let doc = new Doc();
doc.width = canvas.width();

let ss = new Date();
doc.load(SIMPLE_TEXT);
let ee = new Date().getTime() - ss.getTime();
console.log("load time " + ee + 'ms');

// console.log(doc.words);
// console.log(doc.lines);
// doc.draw(ctx, canvas.height());

text_area.val(doc.plain_text());

// c.onfocus = ()=>{
//   setTimeout(()=>{
//     text_area.focus();
//   });
// };

// canvas.on('focus', () => {
//   setTimeout(() => {
//     text_area.trigger("focus");
//   }, 10);
// });


function paint() {
  ctx.clearRect(0, 0, canvas.width(), canvas.height());
  doc.draw(ctx, canvas.height());
  doc.draw_selection(ctx);
  $('#selectionStart').val(doc.selection.start);
  $('#selectionEnd').val(doc.selection.end);
  ctx.beginPath();
  ctx.moveTo(doc.width, 0);
  ctx.lineTo(doc.width, canvas.height());
  ctx.stroke();
}

let X = $('#selectionStart');
let Y = $('#selectionEnd');


canvas.on('mousedown', (ev) => {
  const offset = canvas.offset();
  const x = ev.pageX - offset.left;
  const y = ev.pageY - offset.top;
  X.val(x);
  Y.val(y);
  
  const start = performance.now();
  const ch = doc.word_by_coordinate(x, y);
  const end = performance.now();
  console.log(ch);
  doc.select(ch.ordinal, ch.ordinal);
  paint();
  const elapsedTime = end - start;
  console.log(`paint time : ${elapsedTime}`);

});

paint();
// doc.character_by_ordinal(512);