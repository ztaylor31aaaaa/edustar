function makewindow() {
    const pageitsself = document.createElement('div');
    const header = document.createElement('div');
    const embed = document.createElement('embed');
    const body = document.createElement('div');

    pageitsself.className = 'draggable-window';
    header.className = 'draggable-header';
    header.innerHTML = '<button onclick="closewindow(this)"></button>';
    pageitsself.appendChild(header);
    body.className = 'draggable-body';
    // embed.src = `https://backend.${window.location.hostname.split('.').slice(-2).join('.')}/chat`;
    embed.src = `/chat`;
    body.appendChild(embed);
    pageitsself.appendChild(body);
    document.body.appendChild(pageitsself);
    
    popupAlert('Use the bottom right corner to resize it and use the top bar to drag it around.', 0, 0);

    drag(pageitsself);
}

function drag(element) { // Thanks for the help Carl + GPT
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    const header = element.querySelector('.draggable-header');

    header.onmousedown = (e) => {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    };

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const elementWidth = element.offsetWidth;
        const elementHeight = element.offsetHeight;

        if (newTop < 0) newTop = 0;
        if (newLeft < 0) newLeft = 0;
        if (newLeft + elementWidth > windowWidth) newLeft = windowWidth - elementWidth;
        if (newTop + elementHeight > windowHeight) newTop = windowHeight - elementHeight;

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function closewindow(button) {
    const window = button.closest('.draggable-window');
    window.remove();
}