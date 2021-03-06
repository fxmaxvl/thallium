"use strict"

var t = require("thallium")
var assert = require("thallium/assert")

function fail() {
    assert.match(
        {propertyOne: 1, propertyTwo: 2, propertyThree: 5, propertyFour: 4},
        {propertyOne: 1, propertyTwo: 2, propertyThree: 3, propertyFour: 4}
    )
}

t.test("cli common", function () {
    t.test("isObjectLike()", function () {
        t.test("passes for objects and functions", function () {})
        t.test("fails for other things", function () {})
    })

    t.test("resolveDefault()", function () {
        t.test("gets CJS default functions", function () {})
        t.test("gets CJS default functions with `default` property", function () {}) // eslint-disable-line max-len
        t.test("gets CJS default arrays with `default` property", function () {}) // eslint-disable-line max-len
        t.test("gets CJS default objects", function () {})
        t.test("gets CJS default primitives", function () {})
        t.testSkip("gets ES6 default functions", function () {})
        t.testSkip("gets ES6 default objects", function () {})
        t.testSkip("gets ES6 default arrays", function () {})
        t.test("gets ES6 default objects with `default` property", fail)
        t.test("gets ES6 default functions with `default` property", fail)
        t.test("gets ES6 default arrays with `default` property", fail)
        t.testSkip("gets ES6 default primitives", function () {})
    })

    t.test("normalizeGlob()", function () {
        t.test("current directory", function () {
            t.test("normalizes a file", function () {})
            t.test("normalizes a glob", function () {})
            t.test("retains trailing slashes", function () {})
            t.test("retains negative", function () {})
            t.test("retains negative + trailing slashes", function () {})
        })

        t.test("absolute directory", function () {
            t.test("normalizes a file", function () {})
            t.test("normalizes a glob", function () {})
            t.test("retains trailing slashes", function () {})
            t.test("retains negative", function () {})
            t.test("retains negative + trailing slashes", function () {})
        })

        t.test("relative directory", function () {
            t.test("normalizes a file", function () {})
            t.test("normalizes a glob", function () {})
            t.test("retains trailing slashes", function () {})
            t.test("retains negative", function () {})
            t.test("retains negative + trailing slashes", function () {})
        })

        t.test("edge cases", function () {
            t.test("normalizes `.` with a cwd of `.`", function () {})
            t.test("normalizes `..` with a cwd of `.`", function () {})
            t.test("normalizes `.` with a cwd of `..`", function () {})
            t.test("normalizes directories with a cwd of `..`", fail)
            t.testSkip("removes excess `.`", function () {})
            t.testSkip("removes excess `..`", function () {})
            t.testSkip("removes excess combined junk", function () {})
        })
    })

    t.test("globParent()", function () {
        t.test("strips glob magic to return parent path", function () {})
        t.test("returns parent dirname from non-glob paths", function () {})
        t.test("gets a base name", function () {})
        t.test("gets a base name from a nested glob", function () {})
        t.test("gets a base name from a flat file", function () {})
        t.test("gets a base name from character class pattern", function () {})
        t.testSkip("gets a base name from brace , expansion", function () {})
        t.testSkip("gets a base name from brace .. expansion", function () {})
        t.test("gets a base name from extglob", fail)
        t.test("gets a base name from a complex brace glob", fail)
    })
})
