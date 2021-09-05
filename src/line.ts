import { PositionedWord } from "./positionedword";
import { Word } from "./word";

export class Line {
    doc;
    width: number;
    baseline: number;
    ascent: number;
    descent: number;
    ordinal: number;
    length: number;
    positionedWords: PositionedWord[];
    constructor(doc,width, baseline:number, ascent:number, descent:number, words: Word[], ordinal:number) {
        this.doc = doc;
        this.width = width;
        this.baseline = baseline;
        this.ascent = ascent;
        this.descent = descent;
        this.ordinal = ordinal;
        let x = 0;
        this.positionedWords = words.map((word) => {
            let left = x;
            x += word.width;
            let wordOrdinal = ordinal;
            ordinal += word.text.length + word.space.length;
            return new PositionedWord(word, this, left, wordOrdinal);
        });
        this.length = ordinal - this.ordinal;
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
    characterByOrdinal(index) {
        // TODO
        // if (index >= this.ordinal && index < this.ordinal + this.length) {

        // }
    }
}