import { Part } from "./part";

class Section{
    parts:Part[];
    ascent:number = 0;
    descent:number = 0;
    width:number = 0;
    length:number = 0;
    plain_text:string = '';
    constructor(runs:[]){
        this.parts = runs.map((run)=>{
            return new Part(run);
        });

        for(let p of this.parts){
            this.ascent = Math.max(this.ascent,p.ascent);
            this.descent = Math.max(this.descent,p.descent);
            this.width += p.width;
            this.length += p.run.text.length;
            this.plain_text += p.run.text;
        }
    }
}

export class Word{
    text:Section;
    space:Section;   
    ascent:number;
    descent:number;
    width:number;
    plain_text:string;
    constructor(coords){

        // var text, space;
        // if (!coords) {
        //     // special end-of-document marker, mostly like a newline with no formatting
        //     text = [{ text: measure.enter }];
        //     return Object.create(prototype, {
        //         text: { value: section(text) },
        //         space: { value: section([]) },
        //         ascent: { value: text.ascent },
        //         descent: { value: text.descent },
        //         width: { value: text.width },
        //         eof: { value: true }
        //     });
        // }
        this.text = new Section(coords.text.cut(coords.spaces));
        this.space = new Section(coords.spaces.cut(coords.end));
        this.ascent = Math.max(this.text.ascent,this.space.ascent);
        this.descent = Math.max(this.text.descent,this.space.descent);
        this.width = this.text.width + this.space.width;
        this.plain_text = this.text.plain_text + this.space.plain_text;
    }
    is_newline(){
        return this.text.parts.length == 1 && this.text.parts[0].is_newline;
    }

    draw(ctx:CanvasRenderingContext2D,x,y){
        for(let part of this.text.parts){
            part.draw(ctx,x,y);
            x += part.width;
        }
    }
}