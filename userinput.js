const events = { mouseX: 0, mouseY: 0, mouse: false };
const eventsPrev = Object.assign({}, events);

// When key down, mark it as true
document.addEventListener("keydown", e => {
    events[e.code] = true;
    // Shift shortcut
    events.Shift = events.ShiftLeft || events.ShiftRight;
});

// Similar to above
document.addEventListener("keyup", e => {
    events[e.code] = false;
    events.Shift = events.ShiftLeft || events.ShiftRight;
});

document.addEventListener("mousedown", e => {
    events.Mouse = true;
});

document.addEventListener("mouseup", e => {
    events.Mouse = false;
});

document.addEventListener("mousemove", e => {
    events.MouseX = e.clientX;
    events.MouseY = e.clientY;
});