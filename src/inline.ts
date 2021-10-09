import { Doc } from "./doc";

export class InlineObject{
    type:'img' | 'video'
    src:string;
    width:number;
    height:number;
    length:number;
    cached:HTMLImageElement;
    constructor(doc:Doc,type:'img' | 'video',src?:string){
        this.length = 1;
        this.src = src;
        this.type = type;
        if(type === 'img'){
            if(!this.cached){
                this.cached = document.createElement('img');
                this.cached.src = this.src; 
                this.cached.addEventListener('load', e => {
                    this.height = this.cached.height;
                    this.width = this.cached.width;
                    doc.layout();
                });
            }
        }
    }
    draw(ctx:CanvasRenderingContext2D,x:number,y:number){
        switch(this.type){
            case 'img':
                // const img_div = document.querySelector("#images-div");
                if(!this.cached){
                    this.cached = document.createElement('img');
                    this.cached.src = this.src; 
                    this.cached.addEventListener('load', e => {
                        this.height = this.cached.height;
                        this.width = this.cached.width;
                        ctx.drawImage(this.cached,x,y - this.cached.height);
                    });
                }
                ctx.drawImage(this.cached,x,y - this.cached.height);
                break;
        }
    }
    toString(){
        return `{img:${this.src}}`;
    }
}
