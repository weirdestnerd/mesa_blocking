let mymap = L.map('mapid').setView([33.399096, -111.713036], 11.4);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib2RnYmFkZWIiLCJhIjoiY2pvb2pjcnVjMW10aDNrbnZ2cnh4dWFieCJ9.3-pk14uWdAopXCwSGYMonw', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoib2RnYmFkZWIiLCJhIjoiY2pvb2pjcnVjMW10aDNrbnZ2cnh4dWFieCJ9.3-pk14uWdAopXCwSGYMonw'
}).addTo(mymap);

//restrict zoom out to city level
mymap.setMinZoom(11.4);

//restrict draggable map to city bounds
let MesaCityNECorner = L.latLng(33.516079, -111.841803);
let MesaCitySWCorner = L.latLng(33.282113, -111.584269);
let bounds = L.latLngBounds(MesaCityNECorner, MesaCitySWCorner);
mymap.setMaxBounds(bounds);

function renderShapeFile(shapefile) {
    let shpfile = new L.Shapefile(shapefile);
    shpfile.addTo(mymap);
}

//draw city outline
let xmlHttpReq = new XMLHttpRequest();
xmlHttpReq.responseType = 'arraybuffer';
xmlHttpReq.open('GET', '/shapefile/MesaCityShp.zip');

xmlHttpReq.onreadystatechange = () => {
    if (xmlHttpReq.readyState === 4 && xmlHttpReq.status === 200) {
        renderShapeFile(xmlHttpReq.response);
    }
};
xmlHttpReq.send();