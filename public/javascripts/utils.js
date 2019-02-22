const mapconsole = {
    message: function (message, await) {
        if (typeof message !== 'string') {
            console.error('map console message must be string');
            return;
        }
        this.done();

        document.querySelector('div#console rect.message_color').setAttribute('fill', 'green');
        document.querySelector('div#console strong.message_type').innerHTML = 'Message';
        document.querySelector('div#console div.console_body p.message').innerHTML = message;
        console.log(message);
        document.querySelector('div#console').className = 'show';

        if (!await || await === false) {
            setTimeout(function () {
                if (document.querySelector('div#console div.console_body p.message').innerHTML === message) {
                    document.querySelector('div#console').classList.remove("show")
                }
            }, 5000);
        }
    },
    error: function (message) {
        if (typeof message !== 'string') {
            console.error('map console message must be string');
            return;
        }
        document.querySelector('div#console rect.message_color').setAttribute('fill', 'red');
        document.querySelector('div#console strong.message_type').innerHTML = 'Error';
        document.querySelector('div#console div.console_body p.message').innerHTML = message;
        console.log(message);
        document.querySelector('div#console').className = 'show';

        setTimeout(function () {
            if (document.querySelector('div#console div.console_body p.message').innerHTML === message) {
                document.querySelector('div#console').classList.remove("show")
            }
        }, 5000);
    },
    done: function () {
        document.querySelector('div#console').classList.remove("show")
    }
};