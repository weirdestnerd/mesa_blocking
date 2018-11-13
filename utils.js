function Coord(lat, lng) {
    this.lat = lat;
    this.lng = lng;
    this.log = () => {
        console.log("lat: %d, lng: %d", this.lat, this.lng);
    }
}

module.exports = {
    Coord: Coord
};