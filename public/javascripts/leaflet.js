let mymap = L.map('mapid').setView([33.399096, -111.713036], 12);
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib2RnYmFkZWIiLCJhIjoiY2pvb2pjcnVjMW10aDNrbnZ2cnh4dWFieCJ9.3-pk14uWdAopXCwSGYMonw', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoib2RnYmFkZWIiLCJhIjoiY2pvb2pjcnVjMW10aDNrbnZ2cnh4dWFieCJ9.3-pk14uWdAopXCwSGYMonw'
}).addTo(mymap);