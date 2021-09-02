class Character{
    runs;
    run;
    offset;
    char;
    constructor(runs,run,offset){
        this.runs = runs;
        this.run = run;
        this.offset = offset;
        this.char = run >= runs.length ? null:runs[run].text[offset];
    }

    static compatible(a:Character, b:Character) {
        if (a.runs !== b.runs) {
            throw new Error('Characters for different documents');
        }
    };

    equal(other){
        Character.compatible(this,other);
        return this.run === other.run;
    }

    cut(upTo:Character){
        Character.compatible(this,upTo);
        let self = this;
        return function(eachRun){
            for(let i = self.run;i <= upTo.run;i++){
                let run = self.runs[i];
                if(run){
                    const start = (i === self.run) ? self.offset : 0;
                    const stop = (i === upTo.run) ? upTo.offset : run.text.length;
                    if(start < stop){
                        run = Object.create(run);
                        run.text = run.text.substr(start, stop - start);
                        eachRun(run);
                    }
                }
            }
        };
    }
}

export function firstNonEmpty(runs, n) {
    for (; n < runs.length; n++) {
        if (runs[n].text.length != 0) {
            return new Character(runs, n, 0);
        }
    }
    return new Character(runs, runs.length, 0);
}

// export function (runs) {
//     return function(emit) {
//         var c = firstNonEmpty(runs, 0);
//         while (!emit(c) && (c.char !== null)) {
//             c = (c._offset + 1 < runs[c._run].text.length)
//                 ? character(runs, c._run, c._offset + 1)
//                 : firstNonEmpty(runs, c._run + 1);
//         }
//     };
// };