const xmllint = require('xmllint');
const M = require('monet');
const R = require('ramda');
const fs = require("fs");
const config = require("../config/config");
const joda = require("js-joda");
const LocalDateTime = joda.ZonedDateTime;
const Hours = joda.ChronoUnit.HOURS;
const T = require('fantasy-tuples');
const Tuple2 = T.Tuple2;
const Tuple3 = T.Tuple3;


// :: String -> String -> Either ErrorObj String 
function validateXML(schema, xml) {
    const result = xmllint.validateXML({
        xml: xml,
        schema: schema
    }).errors;

    return R.isNil(result) ? M.Either.Right(xml) :
        M.Either.Left(result);
};

// :: JSON -> Lens -> ([a] -> Bool) String -> Either String JSON
function validateAttributeValue(json, lens, validationFunc, errMsg) {
    const array_ = R.map(R.view(lens), json);
    const output = validationFunc(array_);
    return output ? M.Either.Right(json) :
        M.Either.Left(errMsg);

};

// :: [String] -> [fileObj]
function loadFiles(filePaths) {
    var result = [];
    R.forEach(function(i) {
        try {
            result = result.concat(fs.readFileSync(i).toString());
        } catch (e) {
            throw new Error(e.message + ":" + i);
        };
    }, filePaths);
    return result;
};

// :: [a] -> Int -> Bool
function validateJson(array_, number) {
    // make sure all the parking lots dont havemore than `n`spaces
    // highly specific to the business logic
    return R.all(function(x) {
        return x.length <= number;
    }, R.groupWith(R.equals, array_));
};

// :: [a] -> Moment -> Bool
function validateJsonDates(array_, dateTimeObj) {
    // make sure all the dates are after a certain Moment()
    // highly specific to the business logic
    return R.all(function(x) {
        return dateTimeObj.isBefore(x);
    }, array_);
};

// :: [JSON+DateTimeStrings] -> [JSON+DateTimeObjs]
function transformDateTime(array_, lens) {
    return R.map(function(x) {
        const val = R.view(lens, x);
        return R.set(lens, LocalDateTime.parse(val), x);
    }, array_);
};

// :: Int ->  Int
// gives out the number if the number is positive and greater than 0
// gives out zero otherwise
function modifiedSign(x) {
    // note: 0 is added here otherwise it gives out -0 
    // whoch makes test fails ... weird indeed
    return 0 + (x * Math.ceil((Math.sign(x) + 1) / 2));
};

// :: DateTimeObj -> DateTimeObj -> Int -> Float -> Float -> (Float,Float)
function price(parkTime, appTime, T, cost, discount) {
    const hours = modifiedSign(T - (appTime.until(parkTime, Hours)));
    const value = hours * cost;
    const discount_ = modifiedSign(hours - 3) * discount;
    return Tuple2(value, discount_);
};

// :: [Obj] -> String -> DateTimeObj -> Int -> Float -> Float -> (Float, Float, Int)
function totalPrice(array_,field, appTime, T, cost, discount) {
    const length = array_.length;
    const f = R.curry(price)(R.__, appTime, T, cost, discount);
    const acc = {
        "val": 0,
        "dis": 0,
        "cars": length
    };
    const val = R.reduce(function(acc,x) {
        const a = f(x[field]);
        acc.val += a._1;
        acc.dis += a._2;
        return acc;
    }, acc, array_);
    return Tuple3(acc.val, acc.dis, acc.cars);
};

module.exports = {
    validateAttributeValue: validateAttributeValue,
    validateXML: validateXML,
    loadFiles: loadFiles,
    validateJson: validateJson,
    validateJsonDates: validateJsonDates,
    transformDateTime: transformDateTime,
    price: price,
    totalPrice: totalPrice,
    modifiedSign: modifiedSign
};
