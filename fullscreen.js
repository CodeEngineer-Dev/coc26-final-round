//fullscreen button
const fullscreenButton = document.getElementById("fullscreen");


fullscreenButton.addEventListener("click", () => {
    const w = window.open();

    w.document.open();

    w.document.write(`
<!doctype html>

${document.documentElement.outerHTML}


`);

w.document.close()

});