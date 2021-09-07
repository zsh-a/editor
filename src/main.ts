import { Doc, SIMPLE_TEXT } from './doc';
import './style.css'
import $ from 'jquery';
import { positionedChar } from './positionedword';
// const app = document.querySelector<HTMLDivElement>('#app')!

// app.innerHTML = `
//   <h1>Hello Vite!</h1>
//   <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
// `;

// https://www.catch22.net/tuts/neatpad/loading-text-file#


const editor_div = $('#editor-div');
if (editor_div.css('position') != 'absolute') {
  editor_div.css('position', 'relative');
}

var canvas = $('<canvas width="500" height="1500"></canvas>'),
  textAreaDiv = $('<div style="overflow: hidden; position: absolute; height: 0;"></div>'),
  text_area = $('<textarea autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0" ' +
    'style="position: absolute; padding: 0px; width: 1000px; height: 1em; ' +
    'outline: none; font-size: 4px;"></textarea>');

textAreaDiv.append(text_area);
editor_div.append(canvas, textAreaDiv);


// const canvas = $('#canvas');

// const c = document.querySelector("canvas");
// const text_area = $("#hiddenTextArea");

// const c = $('canvas'),text_area = $('#hiddenTextArea');

// const dpr = Math.max(1,window.devicePixelRatio || 1);

// const ctx = c[0].getContext("2d");
const ctx = (<HTMLCanvasElement>canvas[0]).getContext('2d');

let focus_char;
let doc = new Doc();
doc.width = canvas.width();

let ss = new Date();
doc.load(SIMPLE_TEXT);
let ee = new Date().getTime() - ss.getTime();
console.log("load time " + ee + 'ms');

// console.log(doc.words);
// console.log(doc.lines);
// doc.draw(ctx, canvas.height());

// text_area.val(doc.plain_text());

doc.on('select', (index) => {
  console.log(`doc selected ${index}`);
});
var typing_chinese = false;

text_area.on('input', () => {
  if (typing_chinese) return;
  const newText = text_area.val();
  if (text_area_content != newText) {
    text_area_content = '';

    //if (carotaDocument.selectedRange().plainText() != newText)
    doc.selection.end += doc.selection_range().set_text(newText);
    doc.selection.start = doc.selection.end;

    text_area.val('');
    paint();
    // var char = doc.character_by_ordinal(doc.selection.start);
    // if (char) {
    //     carotaDocument.selection.start += char.insert(newText);
    //     carotaDocument.selection.end = carotaDocument.selection.start;
    //     paint();
    // }
  }
});

text_area.on('compositionstart', () => {
  typing_chinese = true;
});

text_area.on('compositionend', () => {
  // console.log(`compositionend : ${text_area.val()}`);
  const newText = text_area.val();
  if (text_area_content != newText) {
    text_area_content = '';

    //if (carotaDocument.selectedRange().plainText() != newText)
    doc.selection.end += doc.selection_range().set_text(newText);
    doc.selection.start = doc.selection.end;

    text_area.val('');
    paint();
    // var char = doc.character_by_ordinal(doc.selection.start);
    // if (char) {
    //     carotaDocument.selection.start += char.insert(newText);
    //     carotaDocument.selection.end = carotaDocument.selection.start;
    //     paint();
    // }
  }
});
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
  // const start = performance.now();
  ctx.clearRect(0, 0, canvas.width(), canvas.height());
  doc.draw(ctx, canvas.height());
  doc.draw_selection(ctx);
  $('#selectionStart').val(doc.selection.start);
  $('#selectionEnd').val(doc.selection.end);
  ctx.beginPath();
  ctx.moveTo(doc.width, 0);
  ctx.lineTo(doc.width, canvas.height());
  ctx.stroke();
  // const end = performance.now();
  // const elapsedTime = end - start;
  // console.log(`paint time : ${elapsedTime}`);
}

function update_textarea() {
  setTimeout(() => {
    text_area.trigger('blur');
    focus_char = focus_char === null ? doc.selection.end : focus_char;
    const end_pos = doc.character_by_ordinal(focus_char);
    if (end_pos.pchar) {
      const bounds = end_pos.pchar.bounds();
      textAreaDiv.css({ left: bounds.left, top: bounds.top + bounds.height });
      text_area.trigger('focus');
      textAreaDiv.css({ left: bounds.left, top: bounds.top });
    }
    text_area_content = '';
    text_area.trigger('select');
    text_area.trigger('focus');
  }, 10);
}

let X = $('#selectionStart');
let Y = $('#selectionEnd');

let select_drag_start = null;
let hover_char: positionedChar;


function select(start: number, end: number) {
  doc.select(start, end);
  paint();
  if (!select_drag_start)
    update_textarea();
  doc.dispatch_event('select', start);
}

canvas.on('mousedown', (ev) => {
  const offset = canvas.offset();
  const x = ev.pageX - offset.left;
  const y = ev.pageY - offset.top;
  X.val(x);
  Y.val(y);

  const ch = doc.character_by_coordinate(x, y);
  select_drag_start = ch.ordinal;
  focus_char = ch.ordinal;
  select(ch.ordinal, ch.ordinal);
});

canvas.on('mousemove', (ev) => {
  const offset = canvas.offset();
  const x = ev.pageX - offset.left;
  const y = ev.pageY - offset.top;
  if (select_drag_start !== null) {
    const new_hover_char = doc.character_by_coordinate(x, y);
    hover_char = new_hover_char;
    if (hover_char) {
      if (select_drag_start > hover_char.ordinal) {
        select(hover_char.ordinal, select_drag_start);
      } else {
        select(select_drag_start, hover_char.ordinal);
      }
      paint();
    }
  }
});

canvas.on('mouseup', () => {
  select_drag_start = null;
  keyboardX = null;
  update_textarea();
  text_area.trigger('focus');
});

setInterval(function () {
  if (doc.toggle_caret())
    paint();

}, 500);

var keyboardSelect = 0, keyboardX = null;
let text_area_content = '';

text_area.on('keydown', (ev) => {
  // console.log(ev.key,typeof ev.key)

    const s = performance.now();
  

  let start = doc.selection.start;
  let end = doc.selection.end;
  let selecting = ev.shiftKey;
  let handled = false;
  const doc_length = doc.length();
  if (!selecting) {
    keyboardSelect = 0;
  } else if (!keyboardSelect) {
    switch (ev.key) {
      case "ArrowLeft":
      case "ArrowUp":
        keyboardSelect = -1;
        break;
      case "ArrowRight":
      case "ArrowDown":
        keyboardSelect = 1;
        break;
    }
  }
  let ordinal = keyboardSelect === 1 ? end : start;

  function change_line(direction: number) {
    const pos = doc.character_by_ordinal(ordinal);
    const ch_bounds = pos.pchar.bounds();
    if (keyboardX === null) {
      keyboardX = ch_bounds.left + ch_bounds.width / 2;
    }
    let y = (direction > 0) ? ch_bounds.top + ch_bounds.height : ch_bounds.top;
    y += direction;
    const new_ch = doc.character_by_coordinate(keyboardX, y);
    ordinal = new_ch.ordinal;
  }
  let changing_caret = false;
  switch (ev.key) {
    case "ArrowLeft":
      if (!selecting && start != end) {
        ordinal = start;
      } else {
        if (ordinal > 0) {
          ordinal--;
        }
      }
      keyboardX = null;
      handled = true;
      break;
    case "ArrowRight":
      if (!selecting && start != end) {
        ordinal = end;
      } else {
        if (ordinal < doc_length) {
          ordinal++;
        }
      }
      keyboardX = null;
      handled = true;
      break;
    case "ArrowUp":
      change_line(-1);
      break;
    case "ArrowDown":
      change_line(1);
      break;
    case "Backspace":
      if (start === end && start > 0) {
        doc.range(start - 1, start).clear();
        focus_char = start - 1;
        select(focus_char, focus_char);
        handled = true;
      }
      break;
    case "Delete":
      if (start === end && start < doc_length) {
        doc.range(start, start + 1).clear();
        select(focus_char, focus_char);
        handled = true;
      }
      break;
  }
  if (changing_caret) {
    switch (keyboardSelect) {
      case 0:
        start = end = ordinal;
        break;
      case -1:
        start = ordinal;
        break;
      case 1:
        end = ordinal;
        break;
    }
    if (start === end) {
      keyboardSelect = 0;
    } else {
      if (start > end) {
        keyboardSelect = -keyboardSelect;
        var t = end;
        end = start;
        start = t;
      }
    }

    focus_char = ordinal;
    select(start, end);
  }

  const e = performance.now();
  const elapsedTime = e - s;
  console.log(`paint time : ${elapsedTime}`);
  console.log(ev.key);
});

paint();
