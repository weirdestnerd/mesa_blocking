const socket = io();
let zoneLayout;
let preprocessedLayout;

let getInitialZoneLayout = () => {
    return new Promise((resolve, reject) => {
        mapconsole.message('Getting Zone Layout ...');
        if (zoneLayout) resolve(zoneLayout);
        socket.emit('get zone layout', layout => {
            if (!layout) {
                mapconsole.error('Internal Server Error.');
                reject();
            }
            zoneLayout = layout;
            resolve(zoneLayout);
        })
    });
};

let getPreprocessedLayout = () => {
    return new Promise((resolve, reject) => {
        mapconsole.message('Preprocessing data ...');
        if (preprocessedLayout) resolve(preprocessedLayout);
        socket.emit('get preprocess layout', layout => {
            if (!layout) {
                mapconsole.error('Internal Server Error');
                reject();
            }
            preprocessedLayout = layout;
            resolve(preprocessedLayout);
        })
    })
};