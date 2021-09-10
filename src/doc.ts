import { Line } from "./line";
import { Part } from "./part";
import { Section, Word } from "./word";
import { Range } from './range';
import { positionedChar } from "./positionedword";
import { FORMATTING_KEYS, Run } from "./run";

const c = <HTMLCanvasElement>document.querySelector("#measure");
export const canvas_measure = c.getContext("2d");

function istext(c) {
    return c !== ' ' && c !== '\n';
}

function isspace(c) {
    return c === ' ';
}
export class Doc {
    _width: number;
    height: number;
    words: Word[];
    lines: Line[];
    selection: { start: number, end: number };
    caret_visable: boolean = true;
    selection_changed: boolean = false;

    static Events = { SELECTION_CHANGE: 'selection-change', TEXT_CHANGE: 'text-change' };

    constructor() {
        this.height = 0;
        this.selection = { start: 0, end: 0 };
        this.event_handler = {};
    }

    width(width?: number) {
        if (!width) return this._width;
        this._width = width;
        this.layout();
        return this._width;
    }

    range(start: number, end: number) {
        return new Range(this, start, end);
    }

    static run2words(runs) {
        let words = new Array<Word>();
        let i = 0;
        let j = 0;
        while (i < runs.length) {
            let text_parts = [];
            let space_parts = [];
            if (runs[i].text[j] === '\n') {
                text_parts.push(new Part(runs[i], j, j + 1));
                ++j;
                if (j == runs[i].text.length) {
                    ++i;
                    j = 0;
                }
            } else {
                while (i < runs.length) {
                    let run = runs[i];
                    if (!istext(run.text[j])) break;
                    let s = j;
                    while (j < run.text.length && istext(run.text[j])) j++;
                    if (j - s == 0) break;
                    text_parts.push(new Part(run, s, j));
                    if (j == run.text.length) {
                        ++i;
                        j = 0;
                    }
                }

                while (i < runs.length) {
                    let run = runs[i];
                    if (!isspace(run.text[j])) break;
                    let s = j;
                    while (j < run.text.length && isspace(run.text[j])) j++;
                    if (j - s == 0) break;
                    space_parts.push(new Part(run, s, j));
                    if (j == run.text.length) {
                        ++i;
                        j = 0;
                    }
                }
            }
            words.push(new Word(new Section(text_parts), new Section(space_parts), (text_parts[0] && text_parts[0].run.align) || (space_parts[0] && space_parts[0].run.align)));
        }
        return words;
    }

    load(runs) {
        this.words = Doc.run2words(runs);
        this.layout();
    }
    layout() {
        const _s = performance.now();
        this.lines = [];
        let words = new Array<Word>();
        let line_width = 0;
        let max_ascent = 0;
        let max_descent = 0;
        let ordinal = 0;
        let y = 0;

        if (!this.words[this.words.length - 1]._eof) {
            this.words.push(new Word(new Section([new Part(Run.eof, 0, 1)]), new Section([]), null, true));
        }

        function newline(self: Doc) {
            const line = new Line(self, line_width, y + max_ascent, max_ascent, max_descent, words, ordinal);
            self.lines.push(line);
            y += max_ascent + max_descent;
            ordinal += line.length;
            words = new Array<Word>();
            line_width = 0;
            max_descent = 0;
            max_ascent = 0;
        }
        for (let word of this.words) {
            if (word.width + line_width > this.width()) {
                newline(this);
            }
            line_width += word.width;
            max_ascent = Math.max(max_ascent, word.ascent);
            max_descent = Math.max(max_descent, word.descent);
            words.push(word);
            if (word.is_newline()) {
                newline(this);
            }
        }

        if (words.length > 0) {
            newline(this);
        }
        const last_line = this.lines[this.lines.length - 1];
        this.height = !last_line ? 0 : last_line.baseline + last_line.descent;
        const _e = performance.now();
        console.log(`layout time : ${_e - _s}`);
    }

    plain_text() {
        let text = '';
        for (let word of this.words) {
            text += word.plain_text;
        }
        return text;
    }
    draw(ctx: CanvasRenderingContext2D, bottom?: number) {
        bottom = bottom || Number.MAX_VALUE;
        for (let line of this.lines) {
            if (line.baseline - line.ascent > bottom) break;
            line.draw(ctx);
        }
    }

    character_by_coordinate(x: number, y: number) {
        let l = 0, r = this.lines.length - 1;
        while (l < r) {
            let mid = l + r >> 1;
            let t = this.lines[mid].baseline - this.lines[mid].ascent;
            if (y < t) r = mid;
            else l = mid + 1;
        }
        let row;
        if (this.lines[l].baseline - this.lines[l].ascent > y) {
            if (l >= 1) row = l - 1;
            else row = 0;
        } else {
            row = this.lines.length - 1;
        }
        let line = this.lines[row];
        // console.log(row);

        let pwords = line.positionedWords;
        l = 0, r = line.positionedWords.length - 1;
        while (l < r) {
            let mid = l + r >> 1;
            if (pwords[mid].left > x) r = mid;
            else l = mid + 1;
        }
        let word_idx;
        if (pwords[l].left > x) {
            if (l >= 1) word_idx = l - 1;
            else word_idx = 0;
        } else {
            word_idx = pwords.length - 1;
        }
        // console.log(word_idx)

        let word = pwords[word_idx];
        let ch = word.character_by_coordinate(x);
        return ch;
    }

    select(ordinal, ordinalEnd) {
        this.selection.start = ordinal;
        this.selection.end = ordinalEnd;
        this.caret_visable = true;
    }
    draw_selection(ctx: CanvasRenderingContext2D) {
        const start = this.character_by_ordinal(this.selection.start);
        const start_bounds = start.pchar.bounds();
        let line_bounds = start.pchar.pword.line.bounds(false);
        if (this.selection.start === this.selection.end) {
            if (this.caret_visable) {
                ctx.beginPath();
                ctx.moveTo(start_bounds.left, line_bounds.top);
                ctx.lineTo(start_bounds.left, line_bounds.top + line_bounds.height);
                ctx.stroke();
            }
        } else {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
            const end = this.character_by_ordinal(this.selection.end);
            const end_bounds = end.pchar.bounds();

            if (start.pchar.pword.line.ordinal === end.pchar.pword.line.ordinal) {
                ctx.fillRect(start_bounds.left, line_bounds.top, end_bounds.left - start_bounds.left, line_bounds.height);
            } else {
                ctx.fillRect(start_bounds.left, line_bounds.top, line_bounds.width - start_bounds.left, line_bounds.height);
                line_bounds = end.pchar.pword.line.bounds(false);
                ctx.fillRect(line_bounds.left, line_bounds.top, end_bounds.left - line_bounds.left, line_bounds.height);

                let l = 0, r = this.lines.length - 1;
                while (l < r) {
                    let mid = l + r >> 1;
                    if (this.lines[mid].ordinal > start.pchar.ordinal) r = mid;
                    else l = mid + 1;
                }

                if (this.lines[l].ordinal > start.pchar.ordinal) {
                    for (let i = l; ; i++) {
                        let line = this.lines[i];
                        if (line.ordinal + line.length > end.pchar.ordinal) break;
                        line_bounds = line.bounds(false);
                        ctx.fillRect(line_bounds.left, line_bounds.top, line_bounds.width, line_bounds.height);
                    }
                }
            }
            ctx.restore();
        }
    }

    character_by_ordinal(index: number) {

        let l = 0, r = this.lines.length - 1;
        while (l < r) {
            let mid = l + r >> 1;
            if (this.lines[mid].ordinal + this.lines[mid].length > index) r = mid;
            else l = mid + 1;
        }
        let line_no = l;
        let line = this.lines[line_no];
        l = 0, r = line.positionedWords.length - 1;
        while (l < r) {
            let mid = l + r >> 1;
            if (line.positionedWords[mid].ordinal + line.positionedWords[mid].length > index) r = mid;
            else l = mid + 1;
        }
        let word = line.positionedWords[l];
        return new Position(this, line_no, l, word.character_by_ordinal(index));
    }

    toggle_caret() {
        const old = this.caret_visable;
        if (this.selection.start === this.selection.end) {
            // if (this.selectionJustChanged) {
            //     this.selectionJustChanged = false;
            // } else {
            //     this.caretVisible = !this.caretVisible;
            // }
            this.caret_visable = !this.caret_visable;
        }
        return this.caret_visable !== old;
    }

    length() {
        const line_length = this.lines.length;
        const pw_length = this.lines[line_length - 1].positionedWords.length;
        const last_pw = this.lines[line_length - 1].positionedWords[pw_length - 1];
        return last_pw.ordinal + last_pw.length;
    }

    event_handler: {};

    on(event_name: string, handler) {
        if (!this.event_handler[event_name])
            this.event_handler[event_name] = [];
        this.event_handler[event_name].push(handler);
    }

    dispatch_event(event_name: string, ...args) {
        let handlers = this.event_handler[event_name];
        if (handlers) {
            for (let handle of handlers) {
                handle(...args);
            }
        }
    }

    fire_text_change(delta) {
        // dispatch_event(Doc.Events.TEXT_CHANGE,);
    }

    selection_range() {
        return new Range(this, this.selection.start, this.selection.end);
    }

    splice(start: number, end: number, text: string | Run | Run[]) {

        const old_length = this.length();
        let start_pos = this.character_by_ordinal(start);
        const start_pchar = start_pos.pchar;
        const start_pword = start_pos.pchar.pword;
        let prev = start_pos.previous();
        if (typeof text === 'string') {
            let run = new Run();
            run.text = text;
            for (let key of FORMATTING_KEYS) {
                run[key] = prev.pchar.part.run[key];
            }
            text = [run];
        }

        const start_word_chars = start_pword.characters;
        let start_word_index = this.words.indexOf(start_pword.word);
        // TODO search

        const end_pos = start == end ? start_pos : this.character_by_ordinal(end);
        const end_pchar = start == end ? start_pchar : end_pos.pchar;
        const end_pword = start == end ? start_pword : end_pos.pchar.pword;

        let end_word_index = this.words.indexOf(end_pword.word);

        // const end_word = start == end?start_word:end_char.value.pword;
        // const end_word_index = start == end?start_word_index:this.words.indexOf(end_word.word);
        const end_word_chars = start == end ? start_word_chars : end_pword.characters;

        let prefix: positionedChar[];
        if (start_pchar.ordinal === start_pword.ordinal) {
            // the first char of the word
            if (start_word_index > 0) {
                prefix = prev.pchar.pword.characters;
                start_word_index--;
            } else {
                prefix = [];
            }
        } else {
            prefix = start_word_chars.slice(0, start_pchar.ordinal - start_pword.ordinal);
        }

        let suffix: positionedChar[];

        if (end_pchar.ordinal === end_pword.ordinal) {
            // exlude the end symbol
            if (end_pchar.ordinal === this.length() - 1) {
                // todo
                // process the end of file symbol
                suffix = [];
                end_word_index--;
            } else {
                // the last character in the pword
                suffix = end_pword.characters;
            }

        } else {
            suffix = end_word_chars.slice(end_pchar.ordinal - end_pword.ordinal);
        }

        const start_runs = prefix.map(Run.pchar2run);
        const end_runs = suffix.map(Run.pchar2run);
        const new_run = Run.consolidate(start_runs.concat(text).concat(end_runs));
        const new_words = Doc.run2words(new_run);

        this.words.splice(start_word_index, end_word_index - start_word_index + 1, ...new_words);
        this.layout();
        return this.length() - old_length;
    }

    insert() {

    }

}

export class Position {
    doc: Doc;
    line_no: number;
    pword_no: number;
    pchar: positionedChar;
    constructor(doc: Doc, line_no: number, pword_no: number, pchar: positionedChar) {
        this.doc = doc;
        this.line_no = line_no;
        this.pword_no = pword_no;
        this.pchar = pchar;
    }
    equal(o: Position) {
        return o.doc === this.doc && o.line_no === this.line_no && o.pword_no === this.pword_no && this.pchar === o.pchar;
    }

    previous() {
        let index_in_pword = this.pchar.ordinal - this.pchar.pword.ordinal;

        if (index_in_pword > 0) {
            this.pchar = this.pchar.pword.positioned_characters()[index_in_pword - 1];
            return this;
        }
        if (this.pword_no > 0) {
            this.pword_no--;
            const pword_chars = this.doc.lines[this.line_no].positionedWords[this.pword_no].positioned_characters();
            this.pchar = pword_chars[pword_chars.length - 1];
            return this;
        }
        if (this.line_no > 0) {
            this.line_no--;
            const line = this.doc.lines[this.line_no];
            this.pword_no = line.positionedWords.length - 1;
            const pword = line.positionedWords[this.pword_no];
            this.pchar = pword.positioned_characters()[pword.positioned_characters().length - 1];
            return this;
        }
        return this;
    }

    previous_pword() {
        if (this.pword_no > 0) {
            this.pword_no--;
            const pword_chars = this.doc.lines[this.line_no].positionedWords[this.pword_no].positioned_characters();
            this.pchar = pword_chars[0];
            return this;
        }

        if (this.line_no > 0) {
            this.line_no--;
            const line = this.doc.lines[this.line_no];
            this.pword_no = line.positionedWords.length - 1;
            const pword = line.positionedWords[this.pword_no];
            this.pchar = pword.positioned_characters()[0];
            return this;
        }
        return this;
    }

    next() {
        let index_in_pword = this.pchar.ordinal - this.pchar.pword.ordinal;

        if (index_in_pword + 1 < this.pchar.pword.positioned_characters().length) {
            this.pchar = this.pchar.pword.positioned_characters()[index_in_pword + 1];
            return this;
        }
        let line = this.pchar.pword.line;

        if (this.pword_no + 1 < line.positionedWords.length) {
            this.pword_no++;
            this.pchar = line.positionedWords[this.pword_no].positioned_characters()[0];
            return this;
        }

        if (this.line_no + 1 < this.doc.lines.length) {
            this.line_no++;
            this.pword_no = 0;
            this.pchar = this.doc.lines[this.line_no].positionedWords[0].positioned_characters()[0];
            return this;
        }
        return this;
    }

    next_pword() {
        let line = this.pchar.pword.line;
        if (this.pword_no + 1 < line.positionedWords.length) {
            this.pword_no++;
            this.pchar = line.positionedWords[this.pword_no].positioned_characters()[0];
            return this;
        }

        if (this.line_no + 1 < this.doc.lines.length) {
            this.line_no++;
            this.pword_no = 0;
            this.pchar = this.doc.lines[this.line_no].positionedWords[0].positioned_characters()[0];
            return this;
        }
        return this;
    }
}