const utils = require("lib/utils.js");
const config = require("config.js");
const M = require("monet");

const args = process.argv.slice(2);

const filesStrings =
    try {
        return utils.loadFiles(["schema.xml", args[0]]);
    } catch (e) {
        console.error(e);
        process.exit(1);
    };

const state = utils.validateXML(fileStrings[0], fileStrings[1])
    .bind(function(xmlString) {
        const lensPath = R.lensPath(['cars', 'car'])
        const lens = R.lensPath(['id']);

        const data parseString(xmlString)
        const view = R.view(lensPath, x);
        return utils.validateAttributeValue(view, lens, utils.validateJson, "error msg");
    })
    .cata(function(x) {
        console.log(x)
        process.exit(1)
    }, function(x) {
        return x;
    });
