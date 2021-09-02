import { ctx } from './doc';
import { apply_run_style, ENTER, get_run_style, measure_text, NBSP } from './measure';
export class Part{
    run;
    is_newline:boolean;
    width:number;
    ascent:number;
    descent:number;
    constructor(run){
        let is_newline = (run.text.length === 1) && (run.text[0] === '\n');
        let m = measure_text(ctx,is_newline?NBSP:run.text,get_run_style(run));
        this.run = run;
        this.is_newline = is_newline;
        this.width = is_newline?0:m.width;
        this.ascent = m.actualBoundingBoxAscent;
        this.descent = m.actualBoundingBoxDescent;
    }
    draw(ctx:CanvasRenderingContext2D,x,y){
        apply_run_style(ctx,this.run);
        ctx.fillText(this.is_newline?ENTER:this.run.text,x,y);
    }
}