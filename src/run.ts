export class Run{
    text:string;
    color?:string;
    bold?:boolean;
    italic?:boolean;
    size?:number;
    font?:string;

    constructor(text?:string,bold?:boolean){
        this.text = text;
        this.bold = bold;
    }
}