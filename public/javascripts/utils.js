function getSelectedWeek() {
    return document.querySelector('a.dropdown-item.active').getAttribute('value');
}

const mapconsole = {
    message: function (message) {
        if (typeof message !== 'string') {
            console.error('map console message must be string');
            return;
        }
        document.querySelector('p#console').innerHTML = message;
        document.querySelector('p#console').classList = 'bg-success';
        console.log(message);
        setTimeout(function () {
            if (document.querySelector('p#console').innerHTML === message) {
                document.querySelector('p#console').innerHTML = '';
            }
        }, 5000);
    },
    error: function (message) {
        if (typeof message !== 'string') {
            console.error('map console message must be string');
            return;
        }
        document.querySelector('p#console').innerHTML = message;
        document.querySelector('p#console').classList = 'bg-danger';
        console.error(message);
        setTimeout(function () {
            if (document.querySelector('p#console').innerHTML === message) {
                document.querySelector('p#console').innerHTML = '';
            }
        }, 5000);
    },
    done: function () {
        document.querySelector('p#console').innerHTML = '';
    }
};