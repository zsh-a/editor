import { CHINESE_HUGE_TEXT } from "./chinese_doc";
import { Doc } from "./doc";
import { handel_event, handle_mouse_event } from "./dom";
import { HUGE_DOCUMENT } from "./huge_doc";
import { TEXT_DEFAULT_STYLE } from "./measure";
import { positionedChar } from "./positionedword";
import { Run } from "./run";
import { SIMPLE_TEXT } from "./simple_text";

export class Editor {
    doc: Doc;
    canvas: HTMLCanvasElement;
    spacer;
    editor_div;
    textArea_div;
    text_area;
    ctx;
    select_drag_start;
    hover_char: positionedChar;

    focus_char;


    keyboardSelect;
    keyboardX = null;
    text_area_content: string;

    next_caret_toggle;
    focus = false;
    cached_width: number;
    cached_height: number;

    constructor() {
        this.editor_div = document.querySelector('#editor-div');
        this.editor_div.innerHTML = 
            '<div class="spacer">' +
                '<canvas width="100" height="100" class="editor-canvas" style="position: absolute;"></canvas>' +
            '</div>' +
        '<div class="TextArea" style="overflow: hidden; position: absolute; height: 0;">' +
            '<textarea autocorrect="off" autocapitalize="off" spellcheck="false" tabindex="0" ' +
            'style="position: absolute; padding: 0px; width: 1000px; height: 1em; ' +
            'outline: none; font-size: 4px;"></textarea>'
        '</div>';
        this.canvas = <HTMLCanvasElement>this.editor_div.querySelector('.editor-canvas');
        this.spacer = this.editor_div.querySelector('.spacer');
        this.textArea_div = this.editor_div.querySelector('.TextArea');
        this.text_area = this.textArea_div.querySelector('textarea');

        this.select_drag_start = null;
        this.keyboardSelect = 0;
        this.keyboardX = null;
        this.text_area_content = '';
        this.next_caret_toggle = new Date().getTime();
        this.cached_width = this.editor_div.clientWidth
        this.cached_height = this.editor_div.clientHeight;

        const format_button = ['font', 'size', 'bold', 'italic', 'underline', 'strikeout', 'align', 'script', 'color'];
        this.ctx = this.canvas.getContext('2d');

        this.doc = new Doc();
        for (let id of format_button) {
            const elem = document.querySelector(`#${id}`);

            elem.addEventListener('change', (e) => {
                let formatting = {};
                const range = this.doc.selection_range();
                var val = elem.nodeName === 'INPUT' ? elem.checked : elem.value;
                formatting[id] = val;
                // console.log(formatting)
                range.set_formating(formatting);
                this.paint();
            });

            this.doc.on(Doc.Events.SELECTION_CHANGE, () => {
                var formatting = this.doc.selection_range().get_formating();
                var val = id in formatting ? formatting[id] : TEXT_DEFAULT_STYLE[id];
                if (elem.nodeName === 'INPUT') {
                    if (val === Run.MULTIPLE_VALUES) {
                        elem.indeterminate = true;
                    } else {
                        elem.indeterminate = false;
                        elem.checked = val;
                    }
                } else {
                    elem.value = val;
                }
            });
        }

        var typing_chinese = false;
        handel_event(this.text_area,'input', () => {
            if (typing_chinese) return;
            const s = performance.now();
            const newText = this.text_area.value;
            console.log(`new text ${newText}`)
            if (this.text_area_content != newText) {
                this.text_area_content = '';

                //if (carotaDocument.selectedRange().plainText() != newText)
                this.doc.insert(newText);

                this.text_area.value = '';
                this.paint();
                // var char = doc.character_by_ordinal(doc.selection.start);
                // if (char) {
                //     carotaDocument.selection.start += char.insert(newText);
                //     carotaDocument.selection.end = carotaDocument.selection.start;
                //     paint();
                // }
            }
            const e = performance.now();
            const elapsedTime = e - s;
            console.log(`insert time : ${elapsedTime}`);
        });

        handel_event(this.text_area,'compositionstart', () => {
            typing_chinese = true;
        });

        handel_event(this.text_area,'compositionend', () => {
            // console.log(`compositionend : ${text_area.val()}`);
            const newText = this.text_area.value;
            if (this.text_area_content != newText) {
                this.text_area_content = '';

                //if (carotaDocument.selectedRange().plainText() != newText)
                this.doc.selection.end += this.doc.selection_range().set_text(newText);
                this.doc.selection.start = this.doc.selection.end;

                this.text_area.value = '';
                this.paint();
                // var char = doc.character_by_ordinal(doc.selection.start);
                // if (char) {
                //     carotaDocument.selection.start += char.insert(newText);
                //     carotaDocument.selection.end = carotaDocument.selection.start;
                //     paint();
                // }
            }
            typing_chinese = false;
        });

        handel_event(this.editor_div, 'scroll', ()=>{
            this.paint();
        });

        this.doc.on(Doc.Events.SELECTION_CHANGE, () => {
            this.paint();
            if (!this.select_drag_start)
                this.update_textarea();
        });

        handle_mouse_event(this.spacer,'mousedown',(ev,x,y)=>{
            const ch = this.doc.character_by_coordinate(x, y);
            this.select_drag_start = ch.ordinal;
            this.focus_char = ch.ordinal;
            this.select(ch.ordinal, ch.ordinal);
        });

        handle_mouse_event(this.spacer,'mousemove',(ev,x,y)=>{
            if (this.select_drag_start !== null) {
                const new_hover_char = this.doc.character_by_coordinate(x, y);
                this.hover_char = new_hover_char;
                if (this.hover_char) {
                    if (this.select_drag_start > this.hover_char.ordinal) {
                        this.select(this.hover_char.ordinal, this.select_drag_start);
                    } else {
                        this.select(this.select_drag_start, this.hover_char.ordinal);
                    }
                    this.paint();
                }
            }
        });

        handle_mouse_event(this.spacer,'mouseup',(ev,x,y)=>{
            this.select_drag_start = null;
            this.keyboardX = null;
            this.update_textarea();
            this.text_area.focus();
        })

        handel_event(this.text_area,'keydown', (ev) => {
            // console.log(ev.key,typeof ev.key)
            const s = performance.now();


            let start = this.doc.selection.start;
            let end = this.doc.selection.end;
            let selecting = ev.shiftKey;
            let handled = false; // whether event is handled
            const doc_length = this.doc.length();
            if (!selecting) {
                this.keyboardSelect = 0;
            } else if (!this.keyboardSelect) {
                switch (ev.key) {
                    case "ArrowLeft":
                    case "ArrowUp":
                        this.keyboardSelect = -1;
                        break;
                    case "ArrowRight":
                    case "ArrowDown":
                        this.keyboardSelect = 1;
                        break;
                }
            }
            let ordinal = this.keyboardSelect === 1 ? end : start;

            function change_line(self:Editor,direction: number) {
                const pos = self.doc.character_by_ordinal(ordinal);
                const ch_bounds = pos.pchar.bounds();
                if (self.keyboardX === null) {
                    self.keyboardX = ch_bounds.left + ch_bounds.width / 2;
                }
                let y = (direction > 0) ? ch_bounds.top + ch_bounds.height : ch_bounds.top;
                y += direction;
                const new_ch = self.doc.character_by_coordinate(self.keyboardX, y);
                ordinal = new_ch.ordinal;
            }
            let changing_caret = false;
            switch (ev.key) {
                case "ArrowLeft":
                    if (!selecting && start != end) {
                        ordinal = start;
                    } else {

                        if (ordinal > 0) {
                            if (ev.ctrlKey) {
                                const pos = this.doc.character_by_ordinal(ordinal);
                                if (pos.pchar.ordinal === pos.pchar.pword.ordinal) {
                                    ordinal = pos.previous_pword().pchar.ordinal;
                                } else {
                                    ordinal = pos.pchar.pword.ordinal;
                                }
                            } else {
                                ordinal--;
                            }
                        }
                    }
                    this.keyboardX = null;
                    handled = true;
                    changing_caret = true;
                    break;
                case "ArrowRight":
                    if (!selecting && start != end) {
                        ordinal = end;
                    } else {
                        if (ordinal < doc_length) {
                            if (ev.ctrlKey) {
                                const pos = this.doc.character_by_ordinal(ordinal);
                                ordinal = pos.next_pword().pchar.ordinal;
                            } else {
                                ordinal++;
                            }
                        }
                    }
                    this.keyboardX = null;
                    handled = true;
                    changing_caret = true;
                    break;
                case "ArrowUp":
                    change_line(this,-1);
                    changing_caret = true;
                    break;
                case "ArrowDown":
                    change_line(this,1);
                    changing_caret = true;
                    break;
                case "Backspace":
                    if (start === end && start > 0) {
                        this.doc.range(start - 1, start).clear();
                        this.focus_char = start - 1;
                        this.select(this.focus_char, this.focus_char);
                        handled = true;
                    }
                    break;
                case "Delete":
                    if (start === end && start < doc_length - 1) {
                        this.doc.range(start, start + 1).clear();
                        this.select(this.focus_char, this.focus_char);
                        handled = true;
                    }
                    break;
                case 'z':
                    if (ev.ctrlKey) {
                        handled = true;
                        this.doc.perform_undo();
                    }
                    break;
                case 'y':
                    if (ev.ctrlKey) {
                        handled = true;
                        this.doc.perform_undo(true);
                    }
                    break;
                case 'a': // A select all
                    if (ev.ctrlKey) {
                        handled = true;
                        this.doc.select(0,this.doc.length() - 1);
                    }
                    break;
            }


            // if (ev.ctrlKey) {
            //     // var selRange = doc.selectedRange();
            //     // var format = {};
            //     // format[toggle] = selRange.getFormatting()[toggle] !== true;
            //     // selRange.setFormatting(format);
            //     this.doc.width();
            //     this.paint();
            //     handled = true;
            // }
            if (changing_caret) {
                switch (this.keyboardSelect) {
                    case 0:
                        start = end = ordinal;
                        break;
                    case -1:
                        start = ordinal;
                        break;
                    case 1:
                        end = ordinal;
                        break;
                }
                if (start === end) {
                    this.keyboardSelect = 0;
                } else {
                    if (start > end) {
                        this.keyboardSelect = -this.keyboardSelect;
                        var t = end;
                        end = start;
                        start = t;
                    }
                }

                this.focus_char = ordinal;
                this.select(start, end);
            }

            
            const e = performance.now();
            const elapsedTime = e - s;
            // console.log(`paint time : ${elapsedTime}`);
            // console.log(ev.key);
            if(handled) return false;
            return true;
        });

        let self = this;
        setInterval(() => {
            if (self.doc.toggle_caret())
                self.paint();
        }, 500);

        // this.doc.load(CHINESE_HUGE_TEXT);
        // console.log(this.doc.words)
        this.update();
    }

    paint() {
        const _s = performance.now();

        if (this.doc.width() !== this.editor_div.clientWidth) {
            this.doc.width(this.editor_div.clientWidth);
        }

        this.canvas.width = this.editor_div.clientWidth;
        this.canvas.height = this.editor_div.clientHeight;
        this.canvas.style.top = this.editor_div.scrollTop + 'px';
        this.spacer.style.width = this.canvas.width + 'px';
        this.spacer.style.height = Math.max(this.doc.height, this.editor_div.clientHeight) + 'px';

        if (this.doc.height < this.editor_div.clientHeight) {
            this.editor_div.style.overflow = 'hidden';
        } else {
            this.editor_div.style.overflow = 'auto';
        }
        if (this.editor_div.clientWidth < this.canvas.width) {
            this.doc.width(this.editor_div.clientWidth);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.translate(0, -this.editor_div.scrollTop);

        this.doc.draw(this.ctx,this.editor_div.scrollTop, this.editor_div.scrollTop + this.canvas.height);

        if (this.select_drag_start || (this.editor_div.activeElement === this.text_area)) {
        }
        this.doc.draw_selection(this.ctx,this.doc.selection.start,this.doc.selection.end);

        var rect = this.spacer.getBoundingClientRect();
        // doc.draw_selection(ctx);
        this.doc.draw_cursor(rect);
        const _e = performance.now();
        // const elapsedTime = end - start;
        // console.log(`paint time : ${_e - _s}`);
    }

    update_textarea() {
        this.focus_char = this.focus_char === null ? this.doc.selection.end : this.focus_char;
        const end_pos = this.doc.character_by_ordinal(this.focus_char);
        if (end_pos.pchar) {
            const bounds = end_pos.pchar.bounds();
            this.textArea_div.style.left = bounds.left + 'px';
            this.textArea_div.style.top = bounds.top + 'px';
            this.text_area.focus();
        }
        this.text_area_content = this.doc.selection_range().plain_text();
        this.text_area.value = this.text_area_content;
        this.text_area.select();
        setTimeout(() => {
            this.text_area.focus();
        }, 10);
    }
    select(start: number, end: number) {
        this.doc.select(start, end);
    }

    update() {
        let repaint = false;
        let new_focused = this.editor_div.activeElement === this.text_area;
        if (this.focus !== new_focused) {
            this.focus = new_focused;
            repaint = true;
        }
        const now = new Date().getTime();
        if (now > this.next_caret_toggle) {
            this.next_caret_toggle = now + 500;
            if (this.doc.toggle_caret()) {
                repaint = true;
            }
        }

        if (this.editor_div.clientWidth !== this.cached_width || this.editor_div.clientHeight !== this.cached_height) {
            repaint = true;
            this.cached_width = this.editor_div.clientWidth;
            this.cached_height = this.editor_div.clientHeight;
        }

        if (repaint)
            this.paint();
    }
}