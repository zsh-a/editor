import { Line } from "./line";

export function wrap(width, doc) {

    var lineBuffer = [],
        lineWidth = 0,
        maxAscent = 0,
        maxDescent = 0,
        y = 0,
        ordinal = 0,
        quit;

    var store = function(word, emit) {
        lineBuffer.push(word);
        lineWidth += word.width;
        maxAscent = Math.max(maxAscent, word.ascent);
        maxDescent = Math.max(maxDescent, word.descent);
        if (word.isNewLine()) {
            send(emit);
        }
    };

    var send = function(emit) {
        if (quit) {
            return;
        }
        var l = new Line(doc, width, y + maxAscent, maxAscent, maxDescent, lineBuffer, ordinal);
        ordinal += l.length;
        quit = emit(l);
        y += (maxAscent + maxDescent);
        lineBuffer.length = 0;
        lineWidth = maxAscent = maxDescent = 0;
    };

    return function(emit, inputWord) {
        if (inputWord.eof) {
            lineBuffer.push(inputWord);
            send(emit);
        } else {
            if (!lineBuffer.length) {
                store(inputWord, emit);
            } else {
                if (lineWidth + inputWord.text.width > width) {
                    send(emit);
                }
                store(inputWord, emit);
            }
        }
        return quit;
    };
};