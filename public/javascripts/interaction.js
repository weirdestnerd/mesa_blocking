let map = initMap({divID: 'map'});
new DensityControl().load(map);
let dataOnTrucksReady = new Event('trucks data ready');
let analysisControl = new AnalysisControl();
let truckRoutesControl = new TruckRoutesControl();

analysisControl.listenForData().then(() => {
    //WARN: Next line should be the only place to get data. Calling TruckRoutesControl.getData() anywhere else does not guarantee that the data will be available
    analysisControl.setData(truckRoutesControl.getData());
    activateStartButton();
});

truckRoutesControl.load(map);

function showOverallGraphs() {
    document.querySelector('div.analysis_section').classList.remove('hide');
    document.querySelector('div.analysis_start_control').classList.add('hide');
}

function activateStartButton() {
    let startAnalysis = document.querySelector('div.analysis_start_control button');
    startAnalysis.classList.remove('disabled');
    startAnalysis.addEventListener('click', () => {
        analysisControl.load().then(showOverallGraphs);
        document.querySelector('div.analysis_start_control').innerHTML = `<div class="progress blue ligthen-4"><div class="indeterminate blue darken-4"></div></div>`;
    });
}