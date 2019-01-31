const socket = io();
let zoneLayout;

let getZoneLayout = () => {
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