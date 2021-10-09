import { Line } from "./line";
import { Part } from "./part";
import { Section, Word } from "./word";
import { Range } from './range';
import { positionedChar } from "./positionedword";
import { FORMATTING_KEYS, Run } from "./run";
import Delta from 'quill-delta';
import * as Y from 'yjs'
import { WebsocketProvider } from "y-websocket";
import { createMutex } from 'lib0/mutex.js'
import { CHINESE_HUGE_TEXT } from "./chinese_doc";
import { Awareness } from "y-protocols/awareness";
import { InlineObject } from "./inline";

const c = <HTMLCanvasElement>document.querySelector("#measure");
export const canvas_measure = c.getContext("2d");

function istext(c) {
    return c !== ' ' && c !== '\n';
}

function isspace(c) {
    return c === ' ';
}

const CHINESE_PATTERN = new RegExp("[\u4E00-\u9FA5]+");
const ALPHA_PATTERN = new RegExp("[A-Za-z]+");
const CHINESE_PUNCTUATION_PATTERN = /[\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3008|\u3009|\u3010|\u3011|\u300e|\u300f|\u300c|\u300d|\ufe43|\ufe44|\u3014|\u3015|\u2026|\u2014|\uff5e|\ufe4f|\uffe5]/;
function ischinese(c) {
    return CHINESE_PATTERN.test(c);
}
function isalpha(c) {
    return ALPHA_PATTERN.test(c);
}

function ispunctuation(c) {
    return CHINESE_PUNCTUATION_PATTERN.test(c);
}

function randomColor() {   
    return '#'+(Math.random()*0xFFFFFF<<0).toString(16);
}


class Cursor {
    name: string;
    color: string;
    index: number;
    length: number;
    constructor() {
        this.index = 0;
        this.length = 0;
    }
}

export class Doc {
    _width: number;
    height: number;
    words: Word[];
    lines: Line[];
    undo: [];
    redo: [];
    selection: { start: number, end: number };
    caret_visable: boolean = true;
    selection_changed: boolean = false;

    ydoc: Y.Doc;
    ytext: Y.Text;
    awareness: Awareness;
    websocketProvider: WebsocketProvider;

    cursors: Map<string, Cursor>;

    cursors_div: HTMLDivElement;

    static Events = { SELECTION_CHANGE: 'selection-change', TEXT_CHANGE: 'text-change' };

    constructor() {
        this.height = 0;
        this.selection = { start: 0, end: 0 };
        this.event_handler = {};
        this.undo = [];
        this.redo = [];
        let self = this;

        this.cursors_div = <HTMLDivElement>document.querySelector('#cursors');

        this.ydoc = new Y.Doc();
        // Sync clients with the y-websocket provider
        this.websocketProvider = new WebsocketProvider(
            'ws://0.0.0.0:1234', 'quill-demo-2', this.ydoc
        );
        this.awareness = this.websocketProvider.awareness;
        this.cursors = new Map();
        this.ytext = this.ydoc.getText('quill');
        this.websocketProvider.on('status', event => {
            console.log(event.status) // logs "connected" or "disconnected"
        });
        this.ytext.observe((event, trans) => {
            if (trans.local) return;
            createMutex()(() => {
                const delta = event.delta;
                let index = 0;
                for (let i = 0; i < delta.length; i++) {
                    const d = delta[i];
                    if (d.retain) {
                        index += d.retain;
                    } else if (d.insert) {
                        let run = new Run();
                        if(typeof d.insert === 'string'){
                            run.text = d.insert;
                            for (let key in d.attributes) {
                                run[key] = d.attributes[key];
                            }
                        }else{
                            run.text = new InlineObject(this,'img',d.insert.src);
                        }
                        
                        index += this.splice(index, index, run, true);
                    } else {
                        this.splice(index, index + d.delete, [], true);
                    }
                }
            })
        });

        this.on(Doc.Events.TEXT_CHANGE, (delta: Delta) => {
            createMutex()(() => {
                self.ytext.applyDelta(delta.ops);
            })

            if (this.awareness) {
                const aw = this.awareness.getLocalState();
                const sel = this.selection_range();
                if (sel === null) {
                  if (this.awareness.getLocalState() !== null) {
                    this.awareness.setLocalStateField('cursor', (null));
                  }
                }else{
                    const anchor = Y.createRelativePositionFromTypeIndex(this.ytext, sel.start);
                    const head = Y.createRelativePositionFromTypeIndex(this.ytext, sel.end);
                    if (!aw || !aw.cursor || !Y.compareRelativePositions(anchor, aw.cursor.anchor) || !Y.compareRelativePositions(head, aw.cursor.head)) {
                        this.awareness.setLocalStateField('cursor', {
                            anchor,
                            head
                        });
                    }
                }
                
                this.awareness.getStates().forEach((aw, client_id) => {
                    this.update_cursor(aw, client_id, this.ydoc, this.ytext);
                });
            }
        });

        this.on(Doc.Events.SELECTION_CHANGE, () => {
            if (this.awareness) {
                const aw = this.awareness.getLocalState();
                const sel = this.selection_range();
                if (sel === null) {
                  if (this.awareness.getLocalState() !== null) {
                    this.awareness.setLocalStateField('cursor', (null));
                  }
                }else{
                    const anchor = Y.createRelativePositionFromTypeIndex(this.ytext, sel.start);
                    const head = Y.createRelativePositionFromTypeIndex(this.ytext, sel.end);
                    if (!aw || !aw.cursor || !Y.compareRelativePositions(anchor, aw.cursor.anchor) || !Y.compareRelativePositions(head, aw.cursor.head)) {
                        this.awareness.setLocalStateField('cursor', {
                            anchor,
                            head
                        });
                    }
                }
                
                this.awareness.getStates().forEach((aw, client_id) => {
                    this.update_cursor(aw, client_id, this.ydoc, this.ytext);
                });
            }
        });

        this.awareness.on('change', ({ added, removed, updated }) => {
            console.log("awarenesss changed")
            const states = self.awareness.getStates()
            added.forEach(id => {
                self.update_cursor(states.get(id), id, self.ydoc, self.ytext);
            })
            updated.forEach(id => {
                self.update_cursor(states.get(id), id, self.ydoc, self.ytext);
            })
            removed.forEach(id => {
                self.remove_cursor(id.toString());
            })
            const cur = this.awareness.getLocalState()
            // console.log(cur)

            if(cur.cursor){
                const anchor = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(cur.cursor.anchor), this.ydoc);
                const head = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(cur.cursor.head), this.ydoc);
                this.select(anchor.index,head.index);
            }
        });
    }

    update_cursor(aw, clientId, doc, type) {
        try {
            if (aw && aw.cursor && clientId !== doc.clientID) {
                const user = aw.user || {}
                const color = user.color || randomColor();
                const name = user.name || `User: ${clientId}`
                this.create_cursor(clientId.toString(), name, color)
                const anchor = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(aw.cursor.anchor), doc)
                const head = Y.createAbsolutePositionFromRelativePosition(Y.createRelativePositionFromJSON(aw.cursor.head), doc)
                if (anchor && head && anchor.type === type) {
                    this.move_cursor(clientId.toString(), { index: anchor.index, length: head.index - anchor.index })
                }
            } else {
                this.remove_cursor(clientId.toString())
            }
        } catch (err) {
            console.error(err)
        }
    }


    create_cursor(client_id: string, name: string, color: string) {
        if (this.cursors.has(client_id)) return;
        let c = new Cursor();
        c.name = name;
        c.color = color;
        this.cursors.set(client_id, c);
    }

    remove_cursor(client_id: string) {
        this.cursors.delete(client_id);
    }

    move_cursor(client_id: string, value) {
        const v = this.cursors.get(client_id);
        v.index = value.index;
        v.length = value.length;
    }

    draw_cursor(rect) {
        const left = rect.left, top = rect.top;
        let cursor_html = '';
        this.cursors.forEach((cursor, client_id) => {
            const s = Math.min(cursor.index,this.length() - 1), e = Math.min(cursor.index + cursor.length,this.length() - 1);
            const bg_color = cursor.color + '4c';
            const color = cursor.color + 'ff'
            const start = this.character_by_ordinal(s);
            const start_bounds = start.pchar.bounds();
            let line_bounds = start.pchar.pword.line.bounds(true);
            let html = `<span class="ql-cursor" id="ql-cursor-${client_id}">`;

            html += '<span class="ql-cursor-selections">';

            if(s !== e){
                const end = this.character_by_ordinal(e);
                const end_bounds = end.pchar.bounds();

                if (start.pchar.pword.line.ordinal === end.pchar.pword.line.ordinal) {
                    html += `<span class="ql-cursor-selection-block" style="top: ${line_bounds.top + top}px; left: ${start_bounds.left + left}px; width: ${end_bounds.left - start_bounds.left}px; height: ${line_bounds.height}px; background-color: ${bg_color};"></span>`;
                } else {
                    html += `<span class="ql-cursor-selection-block" style="top: ${line_bounds.top + top}px; left: ${start_bounds.left + left}px; width: ${line_bounds.width - start_bounds.left + line_bounds.left}px; height: ${line_bounds.height}px; background-color: ${bg_color};"></span>`;
                    line_bounds = end.pchar.pword.line.bounds(true);
                    html += `<span class="ql-cursor-selection-block" style="top: ${line_bounds.top + top}px; left: ${line_bounds.left + left}px; width: ${end_bounds.left - line_bounds.left}px; height: ${line_bounds.height}px; background-color: ${bg_color};"></span>`;

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
                            html += `<span class="ql-cursor-selection-block" style="top: ${line_bounds.top + top}px; left: ${line_bounds.left + left}px; width: ${line_bounds.width}px; height: ${line_bounds.height}px; background-color: ${bg_color};"></span>`;
                        }
                    }
                }
            }
            html += '</span>';
            if(s === e){
                html += `<span class="ql-cursor-caret-container" style="top: ${start_bounds.top + top}px; left: ${start_bounds.left + left}px; height: ${line_bounds.height}px;">\
                            <span class="ql-cursor-caret" style="background-color: ${bg_color};"></span>\
                        </span>\
                        <div class="ql-cursor-flag"\
                            style="background-color: ${color}; transition-delay: 3000ms; transition-duration: 400ms; top: ${start_bounds.top + top}px; left: ${start_bounds.left + left}px;">\
                            <small class="ql-cursor-name">User: ${client_id}</small>\
                            <span class="ql-cursor-flag-flap"></span>\
                        </div>\
                    </span>`;
            }else{

                const end = this.character_by_ordinal(e);
                const end_bounds = end.pchar.bounds();
                html += `<span class="ql-cursor-caret-container" style="top: ${end_bounds.top + top}px; left: ${end_bounds.left + left}px; height: ${line_bounds.height}px;">\
                            <span class="ql-cursor-caret" style="background-color: ${color};"></span>\
                        </span>\
                        <div class="ql-cursor-flag"\
                            style="background-color: ${color}; transition-delay: 3000ms; transition-duration: 400ms; top: ${end_bounds.top + top}px; left: ${end_bounds.left + left}px;">\
                            <small class="ql-cursor-name">User: ${client_id}</small>\
                            <span class="ql-cursor-flag-flap"></span>\
                        </div>\
                    </span>`;

            }
            cursor_html += html;
        });
        this.cursors_div.innerHTML = cursor_html;
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

            if(typeof runs[i].text !== 'string'){
                text_parts.push(new Part(runs[i]));
                words.push(new Word(new Section(text_parts),new Section(space_parts)));
                i++;
                continue;
            }

            if (runs[i].text.length === 0) {
                i++;
                j = 0;
                continue;
            }

            if (runs[i].text[j] === '\n') {
                text_parts.push(new Part(runs[i], j, j + 1));
                ++j;
                if (j == runs[i].text.length) {
                    ++i;
                    j = 0;
                }
            } else {
                let flag = false;
                while (!flag) {
                    let run = runs[i];
                    if (!istext(run.text[j])) break;
                    let s = j;

                    if (j < run.text.length && ischinese(run.text[j])) {
                        ++j;
                        flag = true;
                    } else {
                        while (j < run.text.length && (istext(run.text[j]) && !ischinese(run.text[j]))) j++;
                    }
                    if (j - s == 0) break;
                    text_parts.push(new Part(run, s, j));
                    if (j == run.text.length) {
                        ++i;
                        j = 0;
                    }
                    flag = true;
                }

                while (i < runs.length) {
                    let run = runs[i];

                    if (!ispunctuation(run.text[j]) && !isspace(run.text[j])) break;
                    let s = j;
                    while (j < run.text.length && (isspace(run.text[j]) || ispunctuation(run.text[j]))) j++;
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
        if (!this.words) {
            this.words = new Array<Word>();
        }

        if (this.words.length === 0 || !this.words[this.words.length - 1]._eof) {
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
            if(word.isInlineObj){
                word.width = word.text.parts[0].text.width;
                word.ascent = word.text.parts[0].text.height;
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
    draw(ctx: CanvasRenderingContext2D, top?: number, bottom?: number) {
        top = top || 0;
        bottom = bottom || Number.MAX_VALUE;
        for (let line of this.lines) {
            if (line.baseline + line.descent < top) continue;
            if (line.baseline - line.ascent > bottom) break;
            line.draw(ctx);
        }
    }

    character_by_coordinate(x: number, y: number) : positionedChar{
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
        let next_pword = pwords[word_idx + 1];
        let ch = word.character_by_coordinate(x, next_pword);
        return ch;
    }

    select(ordinal, ordinalEnd) {
        this.selection.start = ordinal < 0 ? 0 : ordinal;
        this.selection.end = ordinalEnd >= this.length() ? this.length() - 1 : ordinalEnd;
        if (ordinal === ordinalEnd) this.selection.start = this.selection.end = Math.min(ordinal, this.length() - 1);
        this.caret_visable = true;
        this.fire_selection_change();
    }
    draw_selection(ctx: CanvasRenderingContext2D, s: number, e: number) {
        const start = this.character_by_ordinal(s);
        const start_bounds = start.pchar.bounds();
        let line_bounds = start.pchar.pword.line.bounds(true);
        if (s === e) {
            if (this.caret_visable) {
                ctx.beginPath();
                ctx.moveTo(start_bounds.left, line_bounds.top);
                ctx.lineTo(start_bounds.left, line_bounds.top + line_bounds.height);
                ctx.stroke();
            }
        } else {
            ctx.save();
            ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
            const end = this.character_by_ordinal(e);
            const end_bounds = end.pchar.bounds();

            if (start.pchar.pword.line.ordinal === end.pchar.pword.line.ordinal) {
                ctx.fillRect(start_bounds.left, line_bounds.top, end_bounds.left - start_bounds.left, line_bounds.height);
            } else {
                ctx.fillRect(start_bounds.left, line_bounds.top,line_bounds.width - start_bounds.left + line_bounds.left, line_bounds.height);
                line_bounds = end.pchar.pword.line.bounds(true);
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
                        line_bounds = line.bounds(true);
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

    fire_selection_change() {
        this.dispatch_event(Doc.Events.SELECTION_CHANGE);
    }

    fire_text_change(delta: Delta) {
        this.dispatch_event(Doc.Events.TEXT_CHANGE, delta);
    }

    selection_range() {
        return new Range(this, this.selection.start, this.selection.end);
    }

    splice(start: number, end: number, text: string | Run | Run[], apply_remote?: boolean) {
        const _s = performance.now();
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
        } else if (!Array.isArray(text)) {
            text = [text];
        }

        if (!apply_remote) {
            let delta = new Delta();
            delta.retain(start).delete(end - start);
            for (let run of text) {
                let attr = {};
                for (let key in run) {
                    if (key !== 'text' && run[key])
                        attr[key] = run[key];
                }
                delta.insert(run.text, attr);
            }
            this.fire_text_change(delta);
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
            if(prev.pchar.pword.word.isInlineObj){
                prefix = [];
            }else if (start_word_index > 0) {
                prefix = prev.pchar.pword.characters;
                start_word_index--;
            } else {
                prefix = [];
            }
        } else {
            prefix = start_word_chars.slice(0, start_pchar.ordinal - start_pword.ordinal);
        }


        let suffix: positionedChar[] = [];

        if (end_pchar.ordinal === end_pword.ordinal) {
            // exlude the end symbol
            if (end_pchar.ordinal === this.length() - 1 || end_pword.word.isInlineObj) {
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

        this.redo.length = 0;
        this.make_edit_command(this, start_word_index, (end_word_index - start_word_index) + 1, ...new_words)();
        const _e = performance.now();
        console.log(`splice time : ${_e - _s}`);
        return this.length() - old_length;
    }

    make_edit_command(self: Doc, start: number, count: number, ...words) {
        return function (redo?) {
            const old_words = self.words.splice(start, count, ...words);
            // let delta = new Delta();

            let stk = self[redo ? 'redo' : 'undo'];
            while (stk.length > 50) {
                stk.shift();
            }
            stk.push(self.make_edit_command(self, start, words.length, ...old_words));
            self.layout();
        };
    }

    insert(text) {
        const last_end = this.selection.end; // backup before update selection for remote
        const length= this.selection_range().set_text(text);
        this.select(last_end + length, last_end + length);
    }

    perform_undo(redo?) {
        var op = (redo ? this.redo : this.undo).pop();
        if (op) {
            op(!redo);
        }
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