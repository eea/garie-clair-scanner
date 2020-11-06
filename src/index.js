const garie_plugin = require('garie-plugin');
const { resolve } = require('path');
const path = require('path');
const config = require('../config');


const myGetFile = async (options) => {
    options.fileName = 'clair.txt';
    console.log(`myGetFile params: ${options.reportDir} - ${options.fileName}`);
    var data = { "myMeasurement": 0 };
    try {
        const file = await garie_plugin.utils.helpers.getNewestFile(options);
        if (typeof file !== "undefined") {
            // Just for testing purposes, give 100 if data could be extracted         
            data.myMeasurement = 100;
        }
        console.log("Got data");

        resolve(data);
    } catch (err) {
        console.log(`Could not get data file for ${url}`, err);
        reject(data);
    }

    return data;
}

const myGetData = async (item) => {
    const { url } = item.url_settings;
    const { repo } = item.url_settings;
    const { dir } = item.url_settings;

    return new Promise(async (resolve, reject) => {
        try {
            const { reportDir } = item;
            const options = {
                script: path.join(__dirname, './run_clair_scan.sh'),
                url: url,
                reportDir: reportDir,
                params: [ repo, dir, "\"eeacms/www-devel:|eeacms/apache-eea-www:\"" ],
                callback: myGetFile
            }
            console.log("Executing script");
            data = await garie_plugin.utils.helpers.executeScript(options);
            console.log("Executed script");

            resolve(data);
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
