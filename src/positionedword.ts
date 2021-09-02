import { ctx } from "./doc";
import { ENTER, get_font_string, measure_text } from "./measure";
import { Part } from "./part";
import { Word } from "./word";

export function new_line_width(run) {
    return measure_text(ctx, ENTER, get_font_string(run)).width;
}

var positionedChar = {
    bounds: () => {

    }
};

function newLineWidth(run) {
    return measure_text(ctx, ENTER, get_font_string(run)).width;
};


class PositionedWord {
    word: Word;
    line;
    left: number;
    ordinal: number;
    length: number;
    characters;

    constructor(word: Word, line, left, ordinal) {
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
            var cache = [];
            var x = 0, self = this, ordinal = this.ordinal;
            this.parts(function (wordPart) {
                var text = wordPart.run.text;
                for (var c = 0; c < text.length; c++) {
                    var charRun = Object.create(wordPart.run);
                    charRun.text = text[c];
                    var p = new Part(charRun);
                    cache.push(Object.create(positionedChar, {
                        left: { value: x },
                        part: { value: p },
                        word: { value: self },
                        ordinal: { value: ordinal }
                    }));
                    x += p.width;
                    ordinal++;
                }
            });
            this.characters = cache;
        }
    }
//https://github.com/danielearwicker/carota/blob/5beaa16b1d46ea0b00fe2f6da0afc6b4869a2822/src/positionedword.js
    positionedCharacters() {
        this.realiseCharacters();
        return this.characters;
    }

    characterByOrdinal(index) {

    }

}