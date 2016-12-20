const utils = require("./lib/utils");
const config = require("./config/config");
const M = require("monet");
const R = require("ramda");
const joda = require("js-joda");
const LocalDateTime = joda.ZonedDateTime;
const parseString = require('xml2json-light').xml2json;
const express = require("express");
var app = express();
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

let fileStrings = [];

// wish unpacking existed here .. gotta look into that
try {
    fileStrings = utils.loadFiles([args.schema, args.input]);
} catch (e) {
    console.log("Error");
    console.error(e.message);
    process.exit(1);
};

const appStartTime = LocalDateTime.now();
const discountCents = config.discountInCents;
const price = config.price;

const validate = R.curry(utils.validateJson)(R.__, config.maxSpaces);
const validateDates = R.curry(utils.validateJsonDates)(R.__, appStartTime);

const state = utils.validateXML(fileStrings[0], fileStrings[1])
    .bind(function(xmlString) {
        const lensPath = R.lensPath(['cars', 'car']);
        const data = parseString(xmlString);
        const view = R.view(lensPath, data);
        // tranform datetime strings into date time objects
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
        console.error(x);
        process.exit(1);
    }, function(x) {
        // group by parking lot id
        return R.groupBy(function(x) {
            return x.parkinglotid;
        }, x);
    });

app.get("/inventory/:time", function(req, res) {
    const T = req.params.time;
    const state = R.compose(R.flatten, R.values)(state);
    if (T.match(/^\d+\.{1}\d*$/)) {
        const result = utils.totalPrice(state, "parkingtime",
            appStartTime, parseFloat(T), price, discountCents);
        const json = {
            "totalAmountOfCars": result._3,
            "value": result._1,
            "discountInCents": result._2
        };
        return res.status(200).end(JSON.stringify(json));
    }
    return res.status(400).end("time should be a integer/float");

});

app.get("/parkinglots/:id/cars/:time", function(req, res) {
    const T = req.params.time;
    const id = req.params.id;

    if (T.match(/^\d+\.{1}\d*$/) && id.match(/^\d+$/)) {
        const state = state[parseInt(id)];
        const f = R.curry(utils.price)(R.__, appStartTime, parseFloat(T), price, discount);
        const result = R.reduce(function(acc, x) {
            const output = f(x.parkingTime);
            return acc.concat(R.merge(x, {
                "value": output._1,
                "discountInCents": output._2
            }));
        }, [], state);

        return res.status(200).end(JSON.stringify(result));
    }
    return res.status(400).end("id should be an integers and time should be an int/float");

});

app.listen(args.port, function() {
    console.log('Example app listening on port:' + args.port);
});
