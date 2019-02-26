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