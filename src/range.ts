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
        // TODO optimize
        let text = '';
        let start_pos = this.doc.character_by_ordinal(this.start);
        const end_pos = this.doc.character_by_ordinal(this.end);
        while(!start_pos.equal(end_pos)){
            text += start_pos.pchar.char;
            start_pos =  start_pos.next();
        }
        // console.log(text);
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