import { Line } from "./line";
import { Part } from "./part";
import { Section, Word } from "./word";

const c = <HTMLCanvasElement>document.querySelector("#measure");
export const canvas_measure = c.getContext("2d");
// console.log(canvas_measure)
export const SIMPLE_TEXT = [
    { text: '    Crampton Wick,\n    26th Oct 2013\n\n' },
    { text: 'Dear sir/madam,\n\nWith reference to your account ' },
    { text: 'No. 17598732', bold: true },
    {
        text: ', it is with the utmost regret that we have to inform you that your contract with us ' +
            'has been '
    },
    { text: 'terminated forth', italic: true },
    { text: 'with', italic: true, bold: true },
    { text: '.\n\n    Please find enclosed a portrait of ' },
    { text: 'Her Majesty Queen Victoria', size: 24, color: 'red', font: 'Times' },
    { text: ' brushing a gibbon\'s hair.\n\nYours, etc.\n\n' },
    { text: '     Fernando Degroot, Esq.\n     Persistent Undersecretary to His Lordship\n\n' },
    {
        text: 'Children are being urged to take back their "wild time", swapping 30 minutes of screen use for outdoor activities.\n' +
            'The call to renew a connection with nature comes from a collaboration of almost 400 organisations, from playgroups to the NHS.\n' +
            'The Wild Network wants children to take up activities like conkers and camping.\n' +
            '"The tragic truth is that kids have lost touch with nature and the outdoors in just one generation," said chairman Andy Simpson.\n' +
            'The organisers argue that swapping 30 minutes of television and computer games each day for outdoor play would increase the levels of fitness and alertness and improve children\'s well-being\n' +
            '"Time spent outdoors is down, roaming ranges have fallen drastically, activity levels are declining and the ability to identify common species has been lost," said Mr Simpson.\n' +
            'He referred to recent research by the RSPB which suggested only one in five children aged eight to 12 had a connection with nature.\n' +
            '"We need to make more space for wild time in children\'s daily routine, freeing this generation of kids to have the sort of experiences that many of us took for granted"\n' +
            '"With many more parents becoming concerned about the dominance of screen time in their children\'s lives, and growing scientific evidence that a decline in active time is bad news for the health and happiness of our children, we all need to become marketing directors for nature," said Mr Simpson.\n' +
            '"An extra 30 minutes of wild time every day for all under 12-year-olds in the UK would be the equivalent of just three months of their childhood spent outdoors.\n' +
            '"We want parents to see what this magical wonder product does for their kids\' development, independence and creativity, by giving wild time a go."\n' +
            'The campaign launches on Friday with the release of a documentary film, Project Wild Thing.\n' +
            'It tells the story of how, in a bid to get his daughter and son outside, film-maker David Bond appoints himself marketing director for nature, working with branding and outdoor experts to develop a campaign.\n' +
            '"I wanted to understand why my children\'s childhood is so different from mine, whether this matters and, if it does, what I can do about it," said Mr Bond.\n' +
            '"The reasons why kids, whether they live in cities or the countryside, have become disconnected from nature and the outdoors are complex.\n' +
            '"Project Wild Thing isn\'t some misty-eyed nostalgia for the past. We need to make more space for wild time in children\'s daily routine, freeing this generation of kids to have the sort of experiences that many of us took for granted.\n' +
            '"It\'s all about finding wildness on your doorstep and discovering the sights, sounds and smells of nature, whether in a back garden, local park or green space at the end of the road."\n' +
            'The campaign, said to be the biggest ever aiming to reconnect children with the outdoors, includes the National Trust, the RSPB, Play England and the NHS, as well as playgroups, businesses and schools.'
    }
];

// for(let r of SIMPLE_TEXT){
//     let o = Object.assign(new Run(),r);

// }

function istext(c) {
    return c !== ' ' && c !== '\n';
}

function isspace(c) {
    return c === ' ';
}
export class Doc {
    width: number;
    words: Word[];
    lines: Line[];
    selection: { start: 0, end: 0 };
    caret_visable:boolean = true;

    constructor() {
        this.selection = {start:0,end:0};
    }
    load(runs) {
        let i = 0;
        let j = 0;
        this.words = new Array<Word>();
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

            this.words.push(new Word(new Section(text_parts), new Section(space_parts)));
        }
        this.layout();
    }
    layout() {
        this.lines = [];
        let words = new Array<Word>();
        let line_width = 0;
        let max_ascent = 0;
        let max_descent = 0;
        let ordinal = 0;
        let y = 0;

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
            if (word.width + line_width > this.width) {
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
    }

    plain_text(){
        let text = '';
        for(let word of this.words){
            text += word.plain_text;
        }
        return text;
    }
    draw(ctx: CanvasRenderingContext2D,bottom:number) {
        for (let line of this.lines) {
            if(line.baseline - line.ascent > bottom) break;
            line.draw(ctx);
        }
    }

    character_by_coordinate(x:number,y:number){
        let l = 0,r = this.lines.length - 1;
        while(l < r){
            let mid = l + r >> 1;
            let t = this.lines[mid].baseline - this.lines[mid].ascent;
            if(y < t) r = mid;
            else l = mid + 1;
        }
        let row;
        if(this.lines[l].baseline - this.lines[l].ascent > y){
            if(l >= 1) row = l - 1;
            else row = 0;
        }else{
            row = this.lines.length - 1;
        }
        let line = this.lines[row];
        // console.log(row);

        let pwords = line.positionedWords;
        l = 0, r = line.positionedWords.length - 1;
        while(l < r){
            let mid = l + r >> 1;
            if(pwords[mid].left > x) r = mid;
            else l = mid + 1;
        }
        let word_idx ;
        if(pwords[l].left > x){
            if(l >= 1) word_idx = l - 1;
            else word_idx = 0;
        }else{
            word_idx = pwords.length - 1;
        }
        // console.log(word_idx)

        let word = pwords[word_idx];
        let ch = word.character_by_coordinate(x);
        return ch;
    }

    select(ordinal,ordinalEnd){
        this.selection.start = ordinal;
        this.selection.end = ordinalEnd;
    }
    draw_selection(ctx:CanvasRenderingContext2D){
        const start = this.character_by_ordinal(this.selection.start);
        const start_bounds = start.bounds();
        let line_bounds = start.pword.line.bounds(false);
        if(this.selection.start === this.selection.end){
            ctx.beginPath();
            ctx.moveTo(start_bounds.left,line_bounds.top);
            ctx.lineTo(start_bounds.left,line_bounds.top + line_bounds.height);
            ctx.stroke();
        }else{
            ctx.save();
            ctx.fillStyle = 'rgba(0, 100, 200, 0.3)';
            const end = this.character_by_ordinal(this.selection.end);
            const end_bounds = end.bounds();
            
            if(start.pword.line.ordinal === end.pword.line.ordinal){
                ctx.fillRect(start_bounds.left,line_bounds.top,end_bounds.left - start_bounds.left,line_bounds.height);
            }else{
                ctx.fillRect(start_bounds.left,line_bounds.top,line_bounds.width - start_bounds.left,line_bounds.height);
                line_bounds = end.pword.line.bounds(false);
                ctx.fillRect(line_bounds.left,line_bounds.top,end_bounds.left - line_bounds.left,line_bounds.height);
                
                let l = 0,r = this.lines.length - 1;
                while(l < r){
                    let mid = l + r >> 1;
                    if(this.lines[mid].ordinal > start.ordinal) r = mid;
                    else l = mid + 1;
                }

                if(this.lines[l].ordinal > start.ordinal){
                    for(let i = l;;i++){
                        let line = this.lines[i];
                        if(line.ordinal + line.length > end.ordinal) break;
                        line_bounds = line.bounds(false);
                        ctx.fillRect(line_bounds.left,line_bounds.top,line_bounds.width,line_bounds.height);
                    }
                }
            }
            ctx.restore();
        }
    }

    character_by_ordinal(index:number){

        let l = 0,r = this.lines.length - 1;
        while(l < r){
            let mid = l + r >> 1;
            if(this.lines[mid].ordinal + this.lines[mid].length > index) r = mid;
            else l = mid + 1;
        }
        let line_no = l;
        let line = this.lines[line_no];
        l = 0,r = line.positionedWords.length - 1;
        while(l < r){
            let mid = l + r >> 1;
            if(line.positionedWords[mid].ordinal + line.positionedWords[mid].length > index) r = mid;
            else l = mid + 1;
        }
        let word = line.positionedWords[l];
        return word.character_by_ordinal(index);
    }

    toggle_caret(){
        const old = this.caret_visable;
        if(this.selection.start === this.selection.end){
            this.caret_visable = !old;
        }
    }
}