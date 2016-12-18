const xmllint = require('xmllint');
const M = require('monet');
const R = require('ramda');
const fs = require("fs");
const parseString = require("xml2js").parseString;

function validateXML(schema, xml) {
    const result = xmllint.validateXML({
        xml: xml,
        schema: schema
    }).errors;

    return R.isNil(result) ? M.Either.Right(xml) :
        M.Either.Left(result);
}

function validateAttributeValue(json, lens, validationFunc, errMsg) {
    const output = validationFunc(R.map(R.view(lens, R.__), json));
    return output ? M.Either.Right(json) :
        M.Either.Left(errMsg);

}

function loadFiles(filePaths) {
    const result = [];
    for (i in filePaths) {
        try {
            result.concat(fs.readFileSync(i).toString())
        } catch (e) {
            throw new Error(i);
        }
    }
    return result;
}


function validateJson(array_, number) {
    // make sure all the parking lots dont have
    // more than 23 spaces
    // highly specific to the business logic
    return R.all(function(x) {
        return x.length <= number
    }, R.groupWith(R.equals, array_));
}

module.exports = {
    validateAttributeValue: validateAttributeValue,
    validateXML: validateXML,
    loadFiles: loadFiles,
    validateJson: validateJson
};
