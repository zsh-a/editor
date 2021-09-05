import { canvas_measure } from "./doc";
import { Line } from "./line";
import { ENTER, measure_text } from "./measure";
// import { ENTER, get_font_string, measure_text } from "./measure";
import { Part } from "./part";
import { Run } from "./run";
import { Word } from "./word";
import { Rect } from './rect';

// export function new_line_width(run) {
//     return measure_text(ctx, ENTER, get_font_string(run)).width;
// }

// var positionedChar = {
//     bounds: () => {
//         // let wb = this.word.bounds();
//     }
// };

function newLineWidth(run: Run) {
    return measure_text(canvas_measure, ENTER, run).width;
};
export class positionedChar {
    pword: PositionedWord;
    part: Part;
    left: number; // relative position to word
    ordinal: number;
    char;
    constructor(pword: PositionedWord, left: number, ordinal: number, char, part: Part) {
        this.pword = pword;
        this.part = part;
        this.left = left;
        this.ordinal = ordinal;
        this.char = char;
    }
    bounds() {
        // this.part
        const wb = this.pword.bounds();
        const width = this.pword.word.is_newline() ? newLineWidth(this.part.run) : this.part.width;
        return new Rect(wb.left + this.left, wb.top, width, wb.height);
    }
}

// function newLineWidth(run) {
//     return measure_text(ctx, ENTER, get_font_string(run)).width;
// };


export class PositionedWord {
    word: Word;
    line: Line;
    left: number;
    ordinal: number;
    length: number;
    characters: positionedChar[];

    constructor(word: Word, line: Line, left: number, ordinal: number) {
        this.word = word;
        this.line = line;
        this.left = left;
        this.ordinal = ordinal;
        this.length = word.text.length + word.space.length;
    }
    draw(ctx: CanvasRenderingContext2D) {
        this.word.draw(ctx, this.left, this.line.baseline);
    }

    bounds() {
        return new Rect(this.left, this.line.baseline + this.line.ascent, this.word.width // || newLineWidth(this.word.run)
            , this.line.ascent + this.line.descent);
    }

    parts(eachPart) {
        this.word.text.parts.some(eachPart) ||
            this.word.space.parts.some(eachPart);
    }

    realiseCharacters() {
        if (!this.characters) {
            this.characters = new Array<positionedChar>();
            var x = 0, ordinal = this.ordinal;
            let word_part = this.word.text;
            for (let p of word_part.parts) {

                for (let i = p.start; i < p.end; i++) {
                    // TODO use measure_text instead 
                    const t = new Part(p.run, i, i + 1);
                    this.characters.push(new positionedChar(this, x, ordinal, p.run.text[i], t));
                    x += t.width;
                    ordinal++;
                }
            }
            let space_part = this.word.space;
            for (let p of space_part.parts) {
                for (let i = p.start; i < p.end; i++) {
                    const t = new Part(p.run, i, i + 1);
                    this.characters.push(new positionedChar(this, x, ordinal, p.run.text[i], t));
                    x += t.width;
                    ordinal++;
                }
            }
        }
    }
    //https://github.com/danielearwicker/carota/blob/5beaa16b1d46ea0b00fe2f6da0afc6b4869a2822/src/positionedword.js
    positioned_characters() {
        this.realiseCharacters();
        return this.characters;
    }

    character_by_coordinate(x: number) {
        this.realiseCharacters();
        x -= this.left;
        let l = 0, r = this.characters.length - 1;
        while (l < r) {
            let mid = l + r >> 1;
            if (this.characters[mid].left > x) r = mid;
            else l = mid + 1;
        }
        
        if(l <= 0){
            return this.characters[l];
        }

        let ch = this.characters[l];
        let ch_mid = (this.characters[l - 1].left + ch.left) / 2;
        if (x >= ch_mid) return ch;
        return this.characters[l - 1];
    }

    character_by_ordinal(index: number) {
        if (index >= this.ordinal && index < this.ordinal + this.length)
            return this.positioned_characters()[index - this.ordinal];
        return null;
    }
    // characterByOrdinal(index) {
    //     if(index >= this.ordinal && index < this.ordinal + this.length)
    //         return this.positionedCharacters()[index - this.ordinal];
    // }
    // lastCharacter(){
    //     let chars = this.positionedCharacters();
    //     return chars[chars.length - 1];
    // }
    // firstCharacter(){
    //     return this.positionedCharacters()[0];
    // }



}