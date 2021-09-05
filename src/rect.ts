export class Rect{
    left:number;
    top:number;
    width:number;
    height:number;
    constructor(left:number,top:number,width:number,height :number){
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    draw_path(ctx: CanvasRenderingContext2D){
        ctx.beginPath();
        ctx.moveTo(this.left, this.top);
        ctx.lineTo(this.left + this.width, this.top);
        ctx.lineTo(this.left + this.width, this.top + this.height);
        ctx.lineTo(this.left, this.top + this.height);
        ctx.closePath();
    }
    contains(x:number,y:number){
        return x >= this.left && x < this.left + this.width && y >= this.top && y < this.top + this.height;
    }
    offset(x,y){
        return new Rect(this.left + x,this.top + y,this.width,this.height);
    }
    equal(other:Rect){
        return this.left == other.left && this.top == other.top && this.width == other.width && this.height == this.height;
    }
}