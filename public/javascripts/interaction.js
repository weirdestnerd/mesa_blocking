getInitialZoneLayout().then(mapLayout => {
    console.log(mapLayout);
    let mapZone = L.geoJSON();
    mapZone.addData(mapLayout);
    mapZone.setStyle({
        color: "#ff0000"
    });
    mymap.fitBounds(mapZone.getBounds());
    mapZone.addTo(mymap);
    console.log(mapZone);
});

