import {Doc, SIMPLE_TEXT } from './doc';
import './style.css'
import $ from 'jquery';
// const app = document.querySelector<HTMLDivElement>('#app')!

// app.innerHTML = `
//   <h1>Hello Vite!</h1>
//   <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
// `;

// https://www.catch22.net/tuts/neatpad/loading-text-file#



const c = document.querySelector("canvas");
const text_area = <HTMLTextAreaElement>document.querySelector("#hiddenTextArea");

// const c = $('canvas'),text_area = $('#hiddenTextArea');

// const dpr = Math.max(1,window.devicePixelRatio || 1);


// const ctx = c[0].getContext("2d");
const ctx = c.getContext('2d');
// console.log(window.devicePixelRatio)
// ctx.save();
// ctx.strokeStyle = 'gray';
// ctx.strokeRect(0, 0, c.width, c.height);
// ctx.restore();



let doc = new Doc();
doc.width = c.width;

let ss = new Date();
doc.load(SIMPLE_TEXT);
let ee = new Date().getTime() - ss.getTime();
console.log("load time " + ee + 'ms');

// console.log(doc.words);
// console.log(doc.lines);
doc.draw(ctx);


text_area.value = doc.plain_text();

c.onfocus = ()=>{
  setTimeout(()=>{
    text_area.focus();
  });
};


function paint(){
  ctx.clearRect(0,0,c.width,c.height);
  doc.draw(ctx);

}

// let X = <HTMLInputElement>document.querySelector('#selectionStart');
// let Y = <HTMLInputElement>document.querySelector('#selectionEnd');

// c.onmousedown = (ev)=>{

//   console.log(c.offsetLeft,c.offsetTop)
//   X.value = ev.pageX - c.offsetLeft;
//   Y.value = ev.pageY - c.offsetTop;
// };