const garie_plugin = require('garie-plugin')
const path = require('path');
const fs = require('fs');
const config = require('../config');
const bodyParser = require('body-parser');
const serveIndex = require('serve-index');
const flatten = require('flat');


const myGetFile = async (options) => {
    options.fileName = 'clair.json';
    console.log(`myGetFile params: ${options.reportDir} - ${options.fileName}`);
    const file = await garie_plugin.utils.helpers.getNewestFile(options);
    const jsonData = JSON.parse(file);

    return jsonData;
}

const myGetData = async (item) => {
    const { url } = item.url_settings;

    return new Promise(async (resolve, reject) => {
        try {
            const cpuUsage = config.plugins['clair'].cpuUsage ? config.plugins['clair'].cpuUsage : 1
            const { reportDir } = item;
            const options = {
                script: path.join(__dirname, './run_clair_scan.sh'),
                url: url,
                reportDir: reportDir,
                params: [ cpuUsage ],
                callback: myGetFile
            }
            data = await garie_plugin.utils.helpers.executeScript(options);

            var clear_data = {};
            Object.keys(data).forEach(function(data_key){
                clear_data[data_key.replace(/[^\x00-\x7F]/g, "").replace(/\s/g,"")] = data[data_key];
            });

            resolve(clear_data);
        } catch (err) {
            console.log(`Failed to get data for ${url}`, err);
            reject(`Failed to get data for ${url}`);
        }
    });
};



console.log("Start");

const main = async () => {
  return new Promise(async (resolve, reject) => {
    try{
      const {app} = await garie_plugin.init({
        db_name: 'clair',
        getData: myGetData,
        report_folder_name: 'clair-results',
        plugin_name: 'clair',
        app_root: path.join(__dirname, '..'),
        config: config,
        onDemand: true,
      });
      const cpuUsage = config.plugins['clair'].cpuUsage ? config.plugins['clair'].cpuUsage : 1;
      console.log('CPUs usage percentage by each thread: ' + cpuUsage * 100 + '%');
      app.listen(3000, () => {
        console.log('Application listening on port 3000');
      });
    }
    catch(err){
      console.log(err);
    }
  });
}

if (process.env.ENV !== 'test') {
    main();
}
