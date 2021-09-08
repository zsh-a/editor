import { Doc } from "./doc";

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
    clear(){
        return this.doc.splice(this.start,this.end,[]);
    }
}