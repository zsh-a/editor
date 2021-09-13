export function handel_event(element, name, handler) {
    element.addEventListener(name, function(ev) {
        if (handler(ev) === false) {
            ev.preventDefault();
        }
    });
};