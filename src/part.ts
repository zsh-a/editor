import { canvas_measure } from './doc';
import { InlineObject } from './inline';
import { apply_run_style, ENTER, measure_text, NBSP } from './measure';

import { Run } from './run';
export class Part{
    run:Run;
    start:number;
    end:number;
    text:string | InlineObject;
    is_newline:boolean;
    width:number;
    ascent:number;
    descent:number;
    constructor(run:Run,start?:number,end?:number){
        this.start = start;
        this.end = end;
        this.run = run;
        if(typeof run.text == 'string'){
            let text = run.text.slice(start,end);
            this.text  = text;
            let is_newline = (text.length === 1) && (text[0] === '\n');
            let m = measure_text(canvas_measure,is_newline?NBSP:text,run);
            this.is_newline = is_newline;
            this.width = is_newline?0:m.width;
            this.ascent = m.fontBoundingBoxAscent;
            this.descent = m.fontBoundingBoxDescent;
        }else{
            this.text = run.text;
            this.ascent = run.text.height;
            this.descent = 0;
            this.width = run.text.width;
            this.start = 0;
            this.end = 1;
        }

        
    }
    draw(ctx:CanvasRenderingContext2D,x:number,y:number){
        if(typeof this.text === 'string'){
            apply_run_style(ctx,this.run);
            ctx.fillText(this.is_newline?ENTER:this.text,x,y);
            if(this.run.underline){
                ctx.fillRect(x, 1 + y, this.width, 1);
            }
            if(this.run.strikeout){
                ctx.fillRect(x, 1 + y - (this.ascent/2), this.width, 1);
            }
        }else{
            this.text.draw(ctx,x,y);
        }
    }
}