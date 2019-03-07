function createMessageElement(error, message, uniqueID) {
    let color_fill = error ? 'red' : 'green';
    let element = document.createElement('div');
    element.setAttribute('id', uniqueID);
    element.setAttribute('style', 'margin-top:1em');
    element.innerHTML = `<div class="console_header">
        <svg class="bd-placeholder-img rounded mr-2" width="20" height="20" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" focusable="false" role="img">
            <rect class="message_color" width="100%" height="100%" fill="${color_fill}"/>
        </svg>
        <strong class="message_type">${error ? 'Error' : 'Message'}</strong>
    </div>
    <div class="console_body">
     <p class="message">${message}</p></div>`;
    return element;
}

const mapconsole = {
    message: function (message, await) {
        if (typeof message !== 'string') {
            console.error('map console message must be string');
            return;
        }
        let messageID = 'id' + Date.now();
        let element = createMessageElement(null, message, messageID);
        document.querySelector('div#console').insertAdjacentElement('beforeend', element);
        console.log(message);

        if (!await || await === false) {
            setTimeout(function () {
                document.querySelector('div#console').removeChild(document.querySelector(`div#console div#${messageID}`));
            }, 5000);
        }
    },
    error: function (message) {
        if (typeof message !== 'string') {
            console.error('map console message must be string');
            return;
        }
        let messageID = 'id' + Date.now();
        let element = createMessageElement(true, message, messageID);
        document.querySelector('div#console').insertAdjacentElement('beforeend', element);
        console.log(message);

        setTimeout(function () {
            document.querySelector('div#console').removeChild(document.querySelector(`div#console div#${messageID}`));
        }, 5000);
    },
    clear: function () {
        document.querySelector('body').removeChild(document.querySelector(`div#console`));
        let el = document.createElement('div');
        el.setAttribute('id', 'console');
        el.setAttribute('class', 'show');
        document.querySelector('body').insertAdjacentElement('afterbegin', el);
    }
};

function hexColorDistance(first, second) {
    let result = [];
    if (first[0] === '#') first = first.substring(1);
    if (second[0] === '#') second = second.substring(1);
    for (let i = 0; i < 6; i+=2) {
        let sub1 = first.substring(i, i + 2);
        let sub2 = second.substring(i, i + 2);
        let val1 = parseInt(sub1, 16);
        let val2 = parseInt(sub2, 16);
        result.push(val1 - val2);
    }
    return result;
}

function nextHexColor(start, distance) {
    if (start[0] === '#') start = start.substring(1);
    let result = '#';
    for (let i = 0; i < 6; i+=2) {
        let sub = start.substring(i, i + 2);
        let next = parseInt(sub, 16);
        if (typeof distance === "number") {
            next += distance;
        } else {
            next += distance[i / 2];
        }
        if (next > 255) next = 255;
        if (next < 0) next = 0;
        let hex = next.toString(16).toUpperCase();
        if (hex.length === 1) hex = '0' + hex;
        result += hex;
    }
    return result;
}