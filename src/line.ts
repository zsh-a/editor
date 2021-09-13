import { Doc } from "./doc";
import { PositionedWord } from "./positionedword";
import { Rect } from "./rect";
import { Word } from "./word";

export class Line {
    doc:Doc;
    width: number;
    baseline: number;
    ascent: number;
    descent: number;
    ordinal: number;
    length: number;
    align:string;
    positionedWords: PositionedWord[];
    constructor(doc:Doc,width:number, baseline:number, ascent:number, descent:number, words: Word[], ordinal:number) {
        this.doc = doc;
        this.width = width;
        this.baseline = baseline;
        this.ascent = ascent;
        this.descent = descent;
        this.ordinal = ordinal;
        this.align = words[0] && words[0].align || 'left';
        let x = 0;
        
        let idx = ordinal;
        this.positionedWords = new Array<PositionedWord>();
        let offset = 0;
        switch(this.align){
            case 'center':
                offset = (doc.width() - this.width) / 2;
                break;
        }
        for(let word of words){
            this.positionedWords.push(new PositionedWord(word,this,x + offset,idx));
            x += word.width;
            idx += word.text.length + word.space.length;
        }
        this.length = idx - this.ordinal;
        
    }
    draw(ctx: CanvasRenderingContext2D) {
        for (let word of this.positionedWords) {
            word.draw(ctx);
        }
    }
    firstWord() {
        return this.positionedWords[0];
    }
    lastWord() {
        return this.positionedWords[this.positionedWords.length - 1];
    }
    bounds(minimal) {
        if (minimal) {
            let first_word = this.firstWord().bounds(),
                last_word = this.lastWord().bounds();
            return new Rect(first_word.left, this.baseline - this.ascent, last_word.left + last_word.width, this.ascent + this.descent);

        }
        return new Rect(0, this.baseline - this.ascent, this.width, this.ascent + this.descent);
    }
    // characterByOrdinal(index:number) {
    //     // TODO
    //     // if (index >= this.ordinal && index < this.ordinal + this.length) {

    //     // }
    // }
}