"use strict"

/* global setTimeout */

var t = require("../../index.js")
var util = require("../../test-util/base.js")
var n = util.n
var p = util.p

suite("core (asynchronous behavior)", function () {
    test("with normal tests", function () {
        var tt = t.base()
        var called = false

        tt.test("test", function () { called = true })
        tt.run().then(function () { t.true(called) })
        t.false(called)
    })

    test("with shorthand tests", function () {
        var tt = t.base()
        var called = false

        tt.define("assert", function () {
            called = true
            return {test: false, message: "should never happen"}
        })

        tt.test("test").assert()
        tt.run().then(function () { t.true(called) })
        t.false(called)
    })

    test("with async tests + sync done call", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            done()
        })
        tt.run().then(function () { t.true(called) })

        t.false(called)
    })

    test("with async tests + async done call", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function (_, done) {
            called = true
            setTimeout(function () { return done() })
        })

        tt.run().then(function () { t.true(called) })

        t.false(called)
    })

    test("with async tests + duplicate thenable resolution", function () {
        var tt = t.base()
        var called = false

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve) {
                    resolve()
                    resolve()
                    resolve()
                },
            }
        })

        tt.run().then(function () { t.true(called) })

        t.false(called)
    })

    test("with async tests + duplicate thenable rejection", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve, reject) {
                    reject(sentinel)
                    reject()
                    reject()
                },
            }
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
    })

    test("with async tests + mixed thenable (resolve first)", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve, reject) {
                    resolve()
                    reject(sentinel)
                    resolve()
                    reject()
                },
            }
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("pass", [p("test", 0)]),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
    })

    test("with async tests + mixed thenable (reject first)", function () {
        var tt = t.base()
        var called = false
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(util.push(ret))

        tt.async("test", function () {
            called = true
            return {
                then: function (resolve, reject) {
                    reject(sentinel)
                    resolve()
                    reject()
                    resolve()
                },
            }
        })

        tt.run().then(function () {
            t.deepEqual(ret, [
                n("start", []),
                n("start", [p("test", 0)]),
                n("end", [p("test", 0)]),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
                n("exit", []),
            ])
        })

        t.false(called)
    })
})
