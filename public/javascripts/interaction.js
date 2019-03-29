let map = initMap({divID: 'map'});
let dataOnTrucksReady = new Event('trucks data ready');
new DensityControl().load(map);
let analysisControl = new AnalysisControl();
let truckRoutesControl = new TruckRoutesControl();

analysisControl.listen().then(() => {
    //WARN: Next line should be the only place to get data. Calling TruckRoutesControl.getData() anywhere else does not guarantee that the data will be available
    analysisControl.setData(truckRoutesControl.getData());
    analysisControl.load();
});

truckRoutesControl.load(map);