export const TEXT_DEFAULT_STYLE = {
    size: 10,
    font: 'Helvetica',
    color: 'black'
};

export function get_font_string(run) {
    return (run && run.italic ? 'italic ' : '') +
        (run && run.bold ? 'bold ' : '') + ' ' +
        ((run && run.size) || TEXT_DEFAULT_STYLE.size) + 'pt ' +
        ((run && run.font) || TEXT_DEFAULT_STYLE.font);
}

export function apply_run_style(ctx: CanvasRenderingContext2D, run) {
    ctx.fillStyle = (run && run.color) || TEXT_DEFAULT_STYLE.color;
    ctx.font = get_font_string(run);
}

export function get_run_style(run) {
    return 'font: ' + get_font_string(run) +
        '; color: ' + ((run && run.color) || TEXT_DEFAULT_STYLE.color);
}

export const NBSP = exports.nbsp = String.fromCharCode(160);
export const ENTER = exports.enter = String.fromCharCode(9166);

export function measure_text(ctx: CanvasRenderingContext2D,text:string,style:string){
    ctx.save();
    ctx.font = style;
    const ret = ctx.measureText(text);
    ctx.restore();
    return ret;
}
