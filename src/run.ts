import { positionedChar } from "./positionedword";

export const FORMATTING_KEYS = [ 'bold', 'italic', 'underline', 'strikeout', 'color', 'font', 'size', 'align', 'script' ];

export class Run{
    text:string;
    color?:string;
    bold?:boolean;
    italic?:boolean;
    underline?:boolean;
    strikeout?:boolean;
    align?:string;
    script?:boolean;
    size?:number;
    font?:string;
    
    static eof = new Run('⛔');

    static MULTIPLE_VALUES = {};

    constructor(text?:string,bold?:boolean){
        this.text = text;
        this.bold = bold;
    }

    format(template){
        for(let key in template){
            this[key] = template[key];
        }
    }

    static pchar2run(pchar:positionedChar){
        let r = new Run();
        r.text = pchar.char;
        for(let key of FORMATTING_KEYS){
            r[key] = pchar.part.run[key];
        }
        return r;
    }

    static clone(run:Run){
        let res = new Run();
        res.text = run.text;
        for(let key of FORMATTING_KEYS){
            res[key] = run[key];
        }
        return res;
    }

    static same(a:Run,b:Run){
        return FORMATTING_KEYS.every((key)=>{
            return a[key] === b[key];
        });
    }

    static consolidate(runs:Run[]){
        let res = [];
        if(runs.length){
            let current = Run.clone(runs[0]);
            res.push(current);
            for(let i = 1;i < runs.length;i++){
                if(Run.same(current,runs[i])){
                    current.text += runs[i].text;
                }else{
                    current = Run.clone(runs[i]);
                    res.push(current);
                }
            }
        }
        return res;
    }

    merge(o:Run){
        for(let key of FORMATTING_KEYS){
            if(key in this || key in o){
                if(this[key] !== o[key]){
                    this[key] = Run.MULTIPLE_VALUES;
                }
            }
        }
    }
}