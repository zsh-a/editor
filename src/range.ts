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
    // plain_text(){
    //     let text = '';
    //     this.doc.character_by_ordinal(this.start);
    // }
    set_text(text){
        return this.doc.splice(this.start,this.end,text);
    }
    clear(){
        return this.doc.splice(this.start,this.end,[]);
    }
}