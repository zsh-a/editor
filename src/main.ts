import './style.css'

// const app = document.querySelector<HTMLDivElement>('#app')!

// app.innerHTML = `
//   <h1>Hello Vite!</h1>
//   <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
// `;

// https://www.catch22.net/tuts/neatpad/loading-text-file#

let width = 1000,height = 1000;
const c = document.querySelector("canvas");
c.width = width;
c.height = height;

const ctx = c.getContext("2d");
console.log(window.devicePixelRatio)


const text_example = "This is editable rich text, much better than a <textarea>\n, or add a semantically rendered block quote in the middle of the page, like this:\nTry it out for yourself!";
ctx.font = '24px serif';
const metrics = ctx.measureText('a');
const font_height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 20;
console.log('font height : ' + font_height);

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
  constructor(){
    this.doc = new TextDocument();
  }

  paint_line(ctx:CanvasRenderingContext2D, lineno:number){
    const text =  this.doc.getline(lineno);
    const y = lineno * font_height;
    // console.log(text,x);  
    ctx.fillText(text,10,y + 50);
  }
  paint(){
    for(let i = 0;i <this.doc._line_buffer.length - 1;i++){
      this.paint_line(ctx,i);
    }
  }
}

let view = new TextView();
view.paint();