getInitialZoneLayout().then(mapLayout => {
    let mapZone = L.geoJSON();
    mapZone.addData(mapLayout);
    mapZone.setStyle({
        color: "#ff0000"
    });
    mapZone.addTo(mymap);
    mapconsole.message('Zone Layout plotted.');
});

