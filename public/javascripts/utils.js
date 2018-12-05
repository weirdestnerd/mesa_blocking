function getSelectedWeek() {
    return document.querySelector('a.dropdown-item.active').getAttribute('value');
}

const mapconsole = message => {
    if (typeof message !== 'string') {
        console.error('map console message must be string');
        return;
    }
    document.querySelector('p#console').innerHTML = message;
    console.log(message);
};