export function handel_event(element, name, handler) {
    element.addEventListener(name, function(ev) {
        if (handler(ev) === false) {
            ev.preventDefault();
        }
    });
};

export function handle_mouse_event(element, name, handler) {
    element.addEventListener(name, function(ev) {
        var rect = element.getBoundingClientRect();
        return handler(ev, ev.clientX - rect.left, ev.clientY - rect.top);
    });
};