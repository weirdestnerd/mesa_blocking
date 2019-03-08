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

function colorRange() {
    let colors = ['#f7fbff', '#f7fcf5', '#ffffff', '#fff5eb', '#fcfbfd', '#fff5f0', 'f7fcfd', 'f7fcfd', 'f7fcf0', 'fff7ec', 'fff7fb', 'fff7fb', 'f7f4f9', 'fff7f3', 'ffffe5', 'ffffd9', 'ffffe5', 'ffffcc', '#08306b', '#00441b', '#000000', '#7f2704', '#3f007d', '#67000d', '00441b', '4d004b', '084081', '7f0000', '023858', '014636', '67001f', '49006a', '004529', '081d58', '662506', '800026'];
    let colorIndex = Math.floor(Math.random() * (colors.length / 2));
    return {startColor: colors[colorIndex],
        endColor: colors[colorIndex + (colors.length / 2)]}
}