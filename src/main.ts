import './style.css'

// const app = document.querySelector<HTMLDivElement>('#app')!

// app.innerHTML = `
//   <h1>Hello Vite!</h1>
//   <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
// `;

// https://www.catch22.net/tuts/neatpad/loading-text-file#

let width = 800,height = 800;
const c = document.querySelector("canvas");

// const dpr = Math.max(1,window.devicePixelRatio || 1);


c.width = width;
c.height = height;

const ctx = c.getContext("2d");
console.log(window.devicePixelRatio)
ctx.save();
ctx.strokeStyle = 'gray';
ctx.strokeRect(0,0,width,height);
ctx.restore();

ctx.textBaseline = 'alphabetic';
const text_example = "This is editable rich text, much better than a <textarea>\n, or add a semantically rendered block quote in the middle of the page, like this:\nTry it out for yourself!";
ctx.font = '24px serif';
const metrics = ctx.measureText('This is editabley rich text');
const font_height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
console.log(metrics);

class TextDocument{
  _buffer:string = text_example;
  _line_buffer:Array<number>;

  constructor(){
    this._line_buffer = new Array<number>();
    this._line_buffer.push(0);

    for(let i = 0;i < this._buffer.length;i++){
      if(this._buffer[i] == '\n'){
        this._line_buffer.push(i + 1);
      }
    }
    this._line_buffer.push(this._buffer.length);
  }
  getline(lineno:number){
    return this._buffer.slice(this._line_buffer[lineno],this._line_buffer[lineno + 1]);
  }
}

class TextView{
  doc:TextDocument;
  row_spacing:number = 8;
  constructor(){
    this.doc = new TextDocument();
  }

  paint_line(ctx:CanvasRenderingContext2D, lineno:number,baseline:number){
    const text =  this.doc.getline(lineno);

    // ctx.fillText(text,10,y);
  }
  paint(){
    let last_baseline = 0;
    let last_desent = 0;
    for(let i = 0;i <this.doc._line_buffer.length - 1;i++){
      const text =  this.doc.getline(i);
      const m = ctx.measureText(text);
      ctx.fillText(text,0,last_baseline + last_desent + m.actualBoundingBoxAscent + this.row_spacing);
      last_baseline = last_baseline + last_desent + m.actualBoundingBoxAscent + this.row_spacing;
      last_desent = m.actualBoundingBoxDescent;
    }
  }
}

let view = new TextView();
view.paint();
