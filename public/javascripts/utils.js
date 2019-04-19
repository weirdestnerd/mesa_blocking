function Utils() {
    const COLORS = ['#f7fbff', '#f7fcf5', '#ffffff', '#fff5eb', '#fcfbfd', '#fff5f0', 'f7fcfd', 'f7fcfd', 'f7fcf0', 'fff7ec', 'fff7fb', 'fff7fb', 'f7f4f9', 'fff7f3', 'ffffe5', 'ffffd9', 'ffffe5', 'ffffcc', '#08306b', '#00441b', '#000000', '#7f2704', '#3f007d', '#67000d', '00441b', '4d004b', '084081', '7f0000', '023858', '014636', '67001f', '49006a', '004529', '081d58', '662506', '800026'];

    this.mapconsole = {
        message: function (message) {
            if (typeof message !== 'string') {
                console.error('map console message must be string');
                return;
            }
            let toast = `<span>${message}</span>`;
            Materialize.toast(toast, 5000);
            console.log(message);
        },
        error: function (message) {
            let toast = `<span class="red">${message}</span>`;
            Materialize.toast(toast, 5000);
            console.log(message);
        }
    };

    this.colorRange = () => {
        let colorIndex = Math.floor(Math.random() * (COLORS.length / 2));
        return {
            startColor: COLORS[colorIndex],
            endColor: COLORS[colorIndex + (COLORS.length / 2)]
        }
    };

    this.getData = name => {
        return new Promise((resolve, reject) => {
            let datarequest = new XMLHttpRequest();
            datarequest.open('GET', `/map/${name}`);
            datarequest.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            datarequest.responseType = 'json';
            datarequest.onload = e => {
                //TODO: decompress zipped response
                resolve(datarequest.response);
            };
            datarequest.onabort = e => {
                reject('Error: data retrieval is aborted');
            };
            datarequest.onerror = e => {
                reject('Error: internal server error when getting data');
            };
            datarequest.send();
        })
    }
}

let utils = new Utils();
let mapconsole = utils.mapconsole;