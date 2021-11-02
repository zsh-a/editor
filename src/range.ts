import { Doc } from "./doc";
import { Run } from "./run";

export class Range{
    doc:Doc;
    start:number;
    end:number;
    constructor(doc:Doc,start:number,end:number){
        this.doc = doc;
        this.start = start;
        this.end = end;
    }
    plain_text(){
        let text = '';
        let start_pos = this.doc.character_by_ordinal(this.start);
        const end_pos = this.doc.character_by_ordinal(this.end);
        const start_pword = start_pos.pchar.pword;
        const end_pword = end_pos.pchar.pword;
        if(start_pword === end_pword){
            const s = start_pos.pchar.ordinal - start_pword.ordinal;
            const len = end_pos.pchar.ordinal - start_pos.pchar.ordinal;
            text += start_pword.word.plain_text.slice(s,s + len);
        }else{
            const s = start_pos.pchar.ordinal - start_pword.ordinal;
            text += start_pword.word.plain_text.slice(s,start_pword.length);
            let line_no = start_pos.line_no, pword_no = start_pos.pword_no + 1;
            if(pword_no >= this.doc.lines[line_no].positionedWords.length){
                line_no++;
                pword_no = 0;
            }
            while(line_no < end_pos.line_no){
                
                while(pword_no < this.doc.lines[line_no].positionedWords.length){
                    text += this.doc.lines[line_no].positionedWords[pword_no].word.plain_text;
                    ++pword_no;
                }
                ++line_no;
                pword_no = 0;
            }
            while(pword_no < end_pos.pword_no){
                text += this.doc.lines[line_no].positionedWords[pword_no].word.plain_text;
                ++pword_no;
            }
            text += end_pword.word.plain_text.slice(0,end_pos.pchar.ordinal - end_pword.ordinal);
        }
        return text;
    }

    set_text(text){
        return this.doc.splice(this.start,this.end,text);
    }
    save(){
        let pos = this.doc.character_by_ordinal(this.start);
        const end_pos = this.doc.character_by_ordinal(this.end);
        let res = new Array<Run>();
        // TODO optimize
        while(!pos.equal(end_pos)){
            if(typeof pos.pchar.part.run.text !== 'string'){
                // inline object
                res.push(pos.pchar.part.run);
            }else{
                let run = Run.clone(pos.pchar.part.run);
                run.text = pos.pchar.char;
                res.push(run);
            }
            pos = pos.next();
        }
        let runs = Run.consolidate(res);
        return runs;
    }
    set_formating(template){
        const runs = this.save();
        for(let run of runs){
            run.format(template);
        }
        this.set_text(runs);
    }

    get_formating(){
        if(this.start === this.end){
            let pos = this.start;
            if(pos > 0) pos--;
            const ch = this.doc.character_by_ordinal(pos);
            return ch.pchar.part.run;
        }else{
            let pos = this.doc.character_by_ordinal(this.start);
            const end_pos = this.doc.character_by_ordinal(this.end);
            let run = Run.clone(pos.pchar.part.run);
            while(!pos.equal(end_pos)){
                run.merge(pos.pchar.part.run);
                pos = pos.next();
            }
            return run;
        }
    }
    clear(){
        return this.doc.splice(this.start,this.end,[]);
    }
}