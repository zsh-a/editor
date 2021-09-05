import { ctx } from './doc';
import { apply_run_style, ENTER, measure_text, NBSP } from './measure';

import { Run } from './run';
export class Part{
    run:Run;
    start:number;
    end:number;
    text:string;
    is_newline:boolean;
    width:number;
    ascent:number;
    descent:number;
    constructor(run:Run,start:number,end:number){
        this.start = start;
        this.end = end;
        this.run = run;
        let text = run.text.slice(start,end);
        this.text = text;

        let is_newline = (text.length === 1) && (text[0] === '\n');
        let m = measure_text(ctx,is_newline?NBSP:text,run);
        this.is_newline = is_newline;
        this.width = is_newline?0:m.width;
        this.ascent = m.fontBoundingBoxAscent;
        this.descent = m.fontBoundingBoxDescent;
    }
    draw(ctx:CanvasRenderingContext2D,x:number,y:number){
        apply_run_style(ctx,this.run);
        ctx.fillText(this.is_newline?ENTER:this.text,x,y);
    }
}