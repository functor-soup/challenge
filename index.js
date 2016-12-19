const utils = require("./lib/utils");
const config = require("./config/config");
const M = require("monet");
const R = require("ramda");
const moment = require("moment");
const parseString = require('xml2json-light').xml2json;
const args = require("yargs")
    .option('p', {
        alias: 'port',
        default: config.port,
        describe: 'port number to start the application at',
        type: 'number',
        demand: 'true',
        nargs: 1
    })
    .option('s', {
        alias: 'schema',
        default: config.schema,
        describe: 'schema file to validate input',
        type: 'string',
        demand: 'true',
        nargs: 1
    })
    .option('i', {
        alias: 'input',
        describe: 'input xml',
        type: 'string',
        demand: 'true',
        nargs: 1
    })
    .argv;

// wish unpacking existed here .. gotta look into that
try {
    const fileStrings = utils.loadFiles([args.schema, args.input]);
} catch (e) {
    console.log("Error")
    console.error(e.message);
    process.exit(1);
};

const appStartTime = moment();

const validate = R.curry(utils.validateJson)(R.__,config.maxSpaces);
const validateDates = R.curry(utils.validateJsonDates)(R.__,appStartTime);

const state = utils.validateXML(fileStrings[0], fileStrings[1])
    .bind(function(xmlString) {
        const lensPath = R.lensPath(['cars', 'car'])
        const data = parseString(xmlString);
        const view = R.view(lensPath, data);
        // tranform datetime strings into moment objects
        return M.Either.Right(utils.transformDateTime(view, R.lensProp('parkingtime')));
    })
    .bind(function(view) {
        const lens = R.lensProp('parkinglotid');
        return utils.validateAttributeValue(view, lens, validate,
            "exceeds total number of spaces in on parking lot");
    })
    .bind(function(view) {
        const lens = R.lensProp('parkingtime');
        return utils.validateAttributeValue(view, lens, validateDates,
            "One or more of Dates is before app start time");
    })
    .cata(function(x) {
        console.error(x)
        process.exit(1)
    }, function(x) {
	// group by parking lot id
        return R.groupBy(function(x) {
            return x.parkinglotid;
        }, x);
    });

console.log(state);
