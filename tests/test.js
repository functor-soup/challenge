const R = require("ramda");
const M = require("monet");
const E = M.Either;
const utils = require("../lib/utils.js");
const assert = require("chai").assert;
const fs = require("fs");
const parseString = require('xml2json-light').xml2json;
const joda = require("js-joda");
const LocalDateTime = joda.LocalDateTime;
const Hours = joda.ChronoUnit.HOURS;
const T = require('fantasy-tuples');

describe("Utils test", function() {
    const schemaString = fs.readFileSync("./tests/test_schema.xsd").toString();
    const xmlString = fs.readFileSync("./tests/test.xml").toString();
    const incorrectXmlString = fs.readFileSync("./tests/incorrect_xml.xml").toString();

    describe("Schema-validation utility tests", function() {
        it("Schema valid Xml should return a right with the xml string", function() {
            assert.deepEqual(utils.validateXML(schemaString, xmlString), E.Right(xmlString));

        });

        it("Schema invalid Xml should return a left", function() {
            assert.equal(utils.validateXML(schemaString, incorrectXmlString).isLeft(), true);

        });

    })

    describe("JSON has to be validated in terms of some business rules", function() {
        const lensPath = R.lensPath(['shows', 'show'])
        const lens = R.lensProp('type');
        const x = parseString(xmlString)
        const view = R.view(lensPath, x);

        it("Value-valid JSON should return a right given custom validation function", function() {
            const validation = function(y) {
                return 3 == y.filter(function(x) {
                    return x == "1"
                }).length;
            };

            const output = utils.validateAttributeValue(view, lens, validation, "error msg");
            assert.deepEqual(output, E.Right(view));

        });

        it("Value-invalid JSON should return a left given custom validation function", function() {
            const validation = function(y) {
                return 5 == y.filter(function(x) {
                    return x == "1"
                }).length;
            };

            const output = utils.validateAttributeValue(view, lens, validation, "error msg");
            assert.deepEqual(output, E.Left("error msg"));

        });

    });

    describe("Business logic specific validation function tests", function() {
        const input = ["1", "2", "2", "3", "3", "4"];
        const testInputDates = [LocalDateTime.parse("2016-12-25T09:42"), 
		LocalDateTime.parse("2016-12-01T09:42")];

        it("it should not exceed a count, should return true", function() {
            assert.equal(utils.validateJson(input, 3), true);
        })

        it("it should not exceed a count, should return false", function() {
            assert.equal(utils.validateJson(input, 1), false);
        })

        it("should not have dates before given certain date should return true", function() {
            const testDateTime = LocalDateTime.parse("2010-01-01T09:42");
            assert.equal(utils.validateJsonDates(testInputDates, testDateTime), true);
        })

        it("should not have dates before given certain date should return false", function() {
            const testDateTime =  LocalDateTime.parse("2016-12-05T09:42");
            assert.equal(utils.validateJsonDates(testInputDates, testDateTime), false);
        })

    });


    describe("Business logic price generation tests", function() {

        it("modified sign function tests", function() {
            assert.equal(utils.modifiedSign(-9), 0);
            assert.equal(utils.modifiedSign(0), 0);
            assert.equal(utils.modifiedSign(314), 314);

        });

        it("it should calculate the correct price and discount (0 discount)", function() {
            const appStartTime = LocalDateTime.now();
            const parkTime = appStartTime.plusHours(1);
            assert.deepEqual(utils.price(parkTime, appStartTime, 2, 1.8, 20), T.Tuple2(1.8, 0));
        })

        it("it should calculate the correct price and discount ", function() {
            const appStartTime = LocalDateTime.now();
            const parkTime = appStartTime.plusHours(1);

            assert.deepEqual(utils.price(parkTime, appStartTime, 5, 1.8, 20), T.Tuple2(1.8 * 4, 20));
        })

        it("should calculate the number of cars, total value of income and total discount", function() {
            const appStartTime = LocalDateTime.now();
            const parkTime1 = appStartTime.plusHours(1);
            const parkTime2 = appStartTime.plusHours(3);
            const parkTime3 = appStartTime.plusHours(5);

            const array_ = [{
                "x": parkTime1
            }, {
                "x": parkTime2
            }, {
                "x": parkTime3
            }]
            assert.deepEqual(utils.totalPrice(array_, "x", appStartTime, 10, 1.8, 20), T.Tuple3(37.8, 240, 3));
        })

    });


});
