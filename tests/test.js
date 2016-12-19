const R = require("ramda");
const M = require("monet");
const E = M.Either;
const utils = require("../lib/utils.js");
const assert = require("chai").assert;
const fs = require("fs");
const parseString = require('xml2json-light').xml2json;


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
        it("it should not exceed a count, should return true", function() {
            assert.equal(utils.validateJson(input, 3), true);
        })

        it("it should not exceed a count, should return false", function() {
            assert.equal(utils.validateJson(input, 1), false);
        })


    });


});
