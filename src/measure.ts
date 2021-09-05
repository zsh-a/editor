import { Run } from "./run";

export const TEXT_DEFAULT_STYLE = {
    size: 10,
    font: 'Helvetica',
    color: 'black'
};

export function get_font_string(run:Run) {
    return (run && run.italic ? 'italic ' : '') +
        (run && run.bold ? 'bold ' : '') + ' ' +
        ((run && run.size) || TEXT_DEFAULT_STYLE.size) + 'pt ' +
        ((run && run.font) || TEXT_DEFAULT_STYLE.font);
}

export function apply_run_style(ctx: CanvasRenderingContext2D, run:Run) {
    ctx.fillStyle = (run && run.color) || TEXT_DEFAULT_STYLE.color;
    ctx.font = get_font_string(run);
    // console.log(ctx.font)
}

export function get_run_style(run:Run) {
    return 'font: ' + get_font_string(run) +
        '; color: ' + ((run && run.color) || TEXT_DEFAULT_STYLE.color);
}

export const NBSP = String.fromCharCode(160);
export const ENTER = String.fromCharCode(9166);

export function measure_text(ctx: CanvasRenderingContext2D,text:string,run:Run){
    ctx.save();
    ctx.font = get_font_string(run);
    const ret = ctx.measureText(text);
    ctx.restore();
    return ret;
}
