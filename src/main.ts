import { Doc, Events, SIMPLE_TEXT } from './doc';
import './style.css'

import { positionedChar } from './positionedword';
import { HUGE_DOCUMENT } from './huge_doc';
import { TEXT_DEFAULT_STYLE } from './measure';
import { Run } from './run';
// const app = document.querySelector<HTMLDivElement>('#app')!

// app.innerHTML = `
//   <h1>Hello Vite!</h1>
//   <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
// `;

// https://www.catch22.net/tuts/neatpad/loading-text-file#


const editor_div = document.querySelector('#editor-div');

// var canvas = $('<canvas width="100" height="100"></canvas>'),
//   textAreaDiv = $('<div style="overflow: hidden; position: absolute; height: 0;"></div>'),
//   text_area = $('<textarea autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0" ' +
//     'style="position: absolute; padding: 0px; width: 1000px; height: 1em; ' +
//     'outline: none; font-size: 4px;"></textarea>');
editor_div.innerHTML = '<canvas  width="100" height="100" class="editro-canvas"></canvas>' +
  '<div style="overflow: hidden; position: absolute; height: 0;">' +
  '<textarea autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0" ' +
  'style="position: absolute; padding: 0px; width: 1000px; height: 1em; ' +
  'outline: none; font-size: 4px;"></textarea>'
'</div>';

var canvas = <HTMLCanvasElement>editor_div.querySelector('.editro-canvas');
var textArea_div = editor_div.querySelector('div');
var text_area = editor_div.querySelector('textarea');


// const canvas = $('#canvas');

// const c = document.querySelector("canvas");
// const text_area = $("#hiddenTextArea");

// const c = $('canvas'),text_area = $('#hiddenTextArea');

// const dpr = Math.max(1,window.devicePixelRatio || 1);

// const ctx = c[0].getContext("2d");

const format_button = ['font', 'size', 'bold', 'italic', 'underline', 'strikeout', 'align', 'script', 'color'];
const ctx = canvas.getContext('2d');
let focus_char;
let doc = new Doc();

// console.log(doc.words);
// console.log(doc.lines);
// doc.draw(ctx, canvas.height());

// text_area.val(doc.plain_text());


for (let id of format_button) {
  const elem = document.querySelector(`#${id}`);

  elem.addEventListener('change', (e) => {
    let formatting = {};
    const range = doc.selection_range();
    var val = elem.nodeName === 'INPUT' ? elem.checked : elem.value;
    formatting[id] = val;
    // console.log(formatting)
    range.set_formating(formatting);
    paint();
  });

  doc.on(Doc.Events.SELECTION_CHANGE, () => {
    var formatting = doc.selection_range().get_formating();
    var val = id in formatting ? formatting[id] : TEXT_DEFAULT_STYLE[id];
    if (elem.nodeName === 'INPUT') {
      if (val === Run.MULTIPLE_VALUES) {
        elem.indeterminate = true;
      } else {
        elem.indeterminate = false;
        elem.checked = val;
      }
    } else {
      elem.value = val;
    }
  });
}

doc.on(Doc.Events.SELECTION_CHANGE, (start,end) => {
  // console.log(`doc selected ${start},${end}`);
  // doc.range(5,20).save();
});
var typing_chinese = false;

text_area.addEventListener('input', () => {
  if (typing_chinese) return;
  const s = performance.now();
  const newText = text_area.value;
  console.log(`new text ${newText}`)
  if (text_area_content != newText) {
    text_area_content = '';

    //if (carotaDocument.selectedRange().plainText() != newText)
    doc.selection.end += doc.selection_range().set_text(newText);
    doc.selection.start = doc.selection.end;

    text_area.value = '';
    paint();
    // var char = doc.character_by_ordinal(doc.selection.start);
    // if (char) {
    //     carotaDocument.selection.start += char.insert(newText);
    //     carotaDocument.selection.end = carotaDocument.selection.start;
    //     paint();
    // }
  }
  const e = performance.now();
  const elapsedTime = e - s;
  console.log(`insert time : ${elapsedTime}`);
});

text_area.addEventListener('compositionstart', () => {
  typing_chinese = true;
});

text_area.addEventListener('compositionend', () => {
  // console.log(`compositionend : ${text_area.val()}`);
  const newText = text_area.value;
  if (text_area_content != newText) {
    text_area_content = '';

    //if (carotaDocument.selectedRange().plainText() != newText)
    doc.selection.end += doc.selection_range().set_text(newText);
    doc.selection.start = doc.selection.end;

    text_area.value = '';
    paint();
    // var char = doc.character_by_ordinal(doc.selection.start);
    // if (char) {
    //     carotaDocument.selection.start += char.insert(newText);
    //     carotaDocument.selection.end = carotaDocument.selection.start;
    //     paint();
    // }
  }
  typing_chinese = false;
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

  if (doc.width() !== editor_div.clientWidth) {
    doc.width(editor_div.clientWidth);
  }

  canvas.width = editor_div.clientWidth;
  canvas.height = Math.max(doc.height, editor_div.clientHeight);
  if (doc.height < editor_div.clientHeight) {
    editor_div.style.overflow = 'hidden';
  } else {
    editor_div.style.overflow = 'auto';
  }
  if (editor_div.clientWidth < canvas.width) {
    doc.width(editor_div.clientWidth);
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  doc.draw(ctx);

  if (select_drag_start || (editor_div.activeElement === text_area)) {
  }
  doc.draw_selection(ctx);

  // doc.draw_selection(ctx);
  // const end = performance.now();
  // const elapsedTime = end - start;
  // console.log(`paint time : ${elapsedTime}`);
}

function update_textarea() {
  focus_char = focus_char === null ? doc.selection.end : focus_char;
  const end_pos = doc.character_by_ordinal(focus_char);
  if (end_pos.pchar) {
    const bounds = end_pos.pchar.bounds();
    textArea_div.style.left = bounds.left + 'px';
    textArea_div.style.top = bounds.top + 'px';
    text_area.focus();
  }
  text_area_content = doc.selection_range().plain_text();
  text_area.value = text_area_content;
  text_area.select();
  setTimeout(() => {
    text_area.focus();
  }, 10);
}

let select_drag_start = null;
let hover_char: positionedChar;


function select(start: number, end: number) {
  doc.select(start, end);
  doc.dispatch_event(Doc.Events.SELECTION_CHANGE, start,end);
}

doc.on(Doc.Events.SELECTION_CHANGE,()=>{
  paint();
  if (!select_drag_start)
    update_textarea();
});

canvas.addEventListener('mousedown', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = ev.pageX - rect.left;
  const y = ev.pageY - rect.top;

  const ch = doc.character_by_coordinate(x, y);
  select_drag_start = ch.ordinal;
  focus_char = ch.ordinal;
  select(ch.ordinal, ch.ordinal);
});

canvas.addEventListener('mousemove', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = ev.pageX - rect.left;
  const y = ev.pageY - rect.top;
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

canvas.addEventListener('mouseup', () => {
  select_drag_start = null;
  keyboardX = null;
  update_textarea();
  text_area.focus();
});

setInterval(function () {
  if (doc.toggle_caret())
    paint();
}, 500);

var keyboardSelect = 0, keyboardX = null;
let text_area_content = '';

text_area.addEventListener('keydown', (ev) => {
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
          if (ev.ctrlKey) {
            const pos = doc.character_by_ordinal(ordinal);
            if (pos.pchar.ordinal === pos.pchar.pword.ordinal) {
              ordinal = pos.previous_pword().pchar.ordinal;
            } else {
              ordinal = pos.pchar.pword.ordinal;
            }
          } else {
            ordinal--;
          }
        }
      }
      keyboardX = null;
      handled = true;
      changing_caret = true;
      break;
    case "ArrowRight":
      if (!selecting && start != end) {
        ordinal = end;
      } else {
        if (ordinal < doc_length) {
          if (ev.ctrlKey) {
            const pos = doc.character_by_ordinal(ordinal);
            ordinal = pos.next_pword().pchar.ordinal;
          } else {
            ordinal++;
          }
        }
      }
      keyboardX = null;
      handled = true;
      changing_caret = true;
      break;
    case "ArrowUp":
      change_line(-1);
      changing_caret = true;
      break;
    case "ArrowDown":
      change_line(1);
      changing_caret = true;
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


  if (ev.ctrlKey) {
    // var selRange = doc.selectedRange();
    // var format = {};
    // format[toggle] = selRange.getFormatting()[toggle] !== true;
    // selRange.setFormatting(format);
    doc.width();
    paint();
    handled = true;
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

var next_caret_toggle = new Date().getTime();
var focus = false;
var cached_width = editor_div.clientWidth;
var cached_height = editor_div.clientHeight;

function update() {
  let repaint = false;
  let new_focused = editor_div.activeElement === text_area;
  if (focus !== new_focused) {
    focus = new_focused;
    repaint = true;
  }
  const now = new Date().getTime();
  if (now > next_caret_toggle) {
    next_caret_toggle = now + 500;
    if (doc.toggle_caret()) {
      repaint = true;
    }
  }

  if (editor_div.clientWidth !== cached_width || editor_div.clientHeight !== cached_height) {
    repaint = true;
    cached_width = editor_div.clientWidth;
    cached_height = editor_div.clientHeight;
  }

  if (repaint)
    paint();
}

let ss = new Date();
doc.load(SIMPLE_TEXT);
let ee = new Date().getTime() - ss.getTime();
console.log("load time " + ee + 'ms');
update();
