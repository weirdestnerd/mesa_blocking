let mapGeoJSON;
let mapzone;

getInitialZoneLayout().then(mapLayout => {
    mapGeoJSON = mapLayout;
    mapzone = L.geoJSON();
    mapzone.addData(mapLayout);
    // mapzone.setStyle({
    //     color: "#ff0000"
    // });
    mapzone.addTo(mymap);
    mapconsole.message('Zone Layout plotted.');
});

//TODO: on week selection, mapZone.setStyle = (week) => {color = density at week), mapZone.addTo(map)
(function handleWeekSelection() {
    let allWeeks = [].slice.call(document.querySelectorAll('a.dropdown-item'));
    for (let week of allWeeks) {
        week.addEventListener('click', () => {
            allWeeks.forEach(otherWeek => {
                otherWeek.classList.remove('active');
            });
            week.classList.add('active');
            if (!mapGeoJSON) {
            //    TODO:
            }
            let partition = Math.random() * 350;
            // console.log(`partition: ${partition}`);
            // mymap.removeLayer(mapzone);
            mapzone = L.geoJSON(mapGeoJSON, {
                style: function (feature) {
                    let l = feature.geometry.coordinates[0].length;
                    // console.log(`lenght: ${l}`);
                    if (l > partition) {
                        return {color: '#e5f5f9'}
                    } else return {color: '006d2c'}
                }
            }).addTo(mymap);
        })
    }
}());