function AnalysisControl() {
    let analysis_data;

    this.process = callback => {
        if (!callback) return console.error('callback is not provided');
        if (!analysis_data) return callback('Data is not available');
    //    TODO: process analysis_data into components (cans, weeks, customer/week ...)
        callback(null);
    };

    this.setData = data => {
        analysis_data = data;
    };

    this.listen = () => {
        return new Promise(resolve => {
            document.addEventListener('trucks data ready', resolve);
        })
    };

    function activateStartButton() {
        let startAnalysis = document.querySelector('div.analysis_start_control button');
        startAnalysis.classList.remove('disabled');
        startAnalysis.addEventListener('click', () => {
            document.querySelector('div.analysis_start_control').innerHTML = `<div class="progress blue ligthen-4"><div class="indeterminate blue darken-4"></div></div>`;
        });
    }

    this.load = () => {
        activateStartButton();
        this.process(error => {
            if (error) return mapconsole.error(error);
        //    TODO: render trucks and graph sections
        })
    }
}