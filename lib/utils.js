const xmllint = require('xmllint');
const M = require('monet');
const R = require('ramda');
const fs = require("fs");
const moment = require("moment");

// :: String -> String -> Either ErrorObj String 
function validateXML(schema, xml) {
    const result = xmllint.validateXML({
        xml: xml,
        schema: schema
    }).errors;

    return R.isNil(result) ? M.Either.Right(xml) :
        M.Either.Left(result);
}

// :: JSON -> Lens -> ([a] -> Bool) String -> Either String JSON
function validateAttributeValue(json, lens, validationFunc, errMsg) {
    const array_ = R.map(R.view(lens), json);
    const output = validationFunc(array_);
    return output ? M.Either.Right(json) :
        M.Either.Left(errMsg);

}

// :: [String] -> [fileObj]
function loadFiles(filePaths) {
    var result = [];
    R.forEach(function(i) {
        try {
            result = result.concat(fs.readFileSync(i).toString());
        } catch (e) {
            throw new Error(e.message + ":" + i);
        }
    }, filePaths);
    return result;
}

// :: [a] -> Int -> Bool
function validateJson(array_, number) {
    // make sure all the parking lots dont havemore than `n`spaces
    // highly specific to the business logic
    return R.all(function(x) {
        return x.length <= number
    }, R.groupWith(R.equals, array_));
}

// :: [a] -> Moment -> Bool
function validateJsonDates(array_, dateTimeObj) {
    // make sure all the dates are after a certain Moment()
    // highly specific to the business logic
    return R.all(function(x) {
        return dateTimeObj.isBefore(x);
    }, array_);
}

// :: [JSON+DateTimeStrings] -> [JSON+DateTimeObjs]
function transformDateTime(array_, lens) {
    return R.map(function(x) {
        const val = R.view(lens, x);
        return R.set(lens, moment(val), x)
    }, array_);
}

module.exports = {
    validateAttributeValue: validateAttributeValue,
    validateXML: validateXML,
    loadFiles: loadFiles,
    validateJson: validateJson,
    validateJsonDates: validateJsonDates,
    transformDateTime: transformDateTime
};
