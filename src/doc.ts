import { Line } from "./line";
import { Part } from "./part";
import { Run } from "./run";
import { Section, Word } from "./word";

export const c = document.querySelector("canvas");
export const ctx = c.getContext("2d");

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

    constructor() {
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
        let line = new Array<Word>();
        let line_width = 0;
        let max_ascent = 0;
        let max_descent = 0;
        let ordinal = 0;
        let y = 0;

        function newline(self: Doc) {
            self.lines.push(new Line(self, line_width, y + max_ascent, max_ascent, max_descent, line, ordinal));
            y += max_ascent + max_descent;
            ordinal += line.length;
            line = new Array<Word>();
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
            line.push(word);
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
    draw(ctx: CanvasRenderingContext2D) {
        for (let line of this.lines) {
            line.draw(ctx);
        }
    }

}