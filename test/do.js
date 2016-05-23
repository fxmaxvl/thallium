"use strict"

var t = require("../index.js")
var Util = require("../test-util/base.js")
var n = Util.n
var p = Util.p

describe("do()", function () {
    it("exists", function () {
        var tt = t.base()

        t.hasKey(tt, "do")
        t.function(tt.do)
    })

    it("runs blocks in sync tests", function () {
        var tt = t.base()
        var ret = []
        var len, self // eslint-disable-line consistent-this

        tt.reporter(Util.push(ret))

        tt.test("test", function (tt) {
            tt.do(/** @this */ function () {
                len = arguments.length
                self = this
            })
        })

        return tt.run().then(function () {
            t.undefined(self)
            t.equal(len, 0)
            t.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("propagates errors from blocks in sync tests", function () {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.test("test", function (tt) {
            tt.do(function () { throw sentinel })
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
            ])
        })
    })

    it("runs blocks in async tests", function () {
        var tt = t.base()
        var ret = []
        var len, self // eslint-disable-line consistent-this

        tt.reporter(Util.push(ret))

        tt.async("test", function (tt, done) {
            tt.do(/** @this */ function () {
                len = arguments.length
                self = this
            })

            done()
        })

        return tt.run().then(function () {
            t.undefined(self)
            t.equal(len, 0)
            t.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("propagates errors from blocks in async tests", function () {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.async("test", function (tt, done) {
            tt.do(function () { throw sentinel })
            done()
        })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
            ])
        })
    })

    it("runs blocks in inline sync tests", function () {
        var tt = t.base()
        var ret = []
        var len, self // eslint-disable-line consistent-this

        tt.reporter(Util.push(ret))

        tt.test("test").do(/** @this */ function () {
            len = arguments.length
            self = this
        })

        return tt.run().then(function () {
            t.undefined(self)
            t.equal(len, 0)
            t.match(ret, [
                n("start", []),
                n("pass", [p("test", 0)]),
                n("end", []),
            ])
        })
    })

    it("propagates errors from blocks in inline sync tests", function () {
        var tt = t.base()
        var ret = []
        var sentinel = new Error("sentinel")

        sentinel.marker = function () {}

        tt.reporter(Util.push(ret))

        tt.test("test").do(function () { throw sentinel })

        return tt.run().then(function () {
            t.match(ret, [
                n("start", []),
                n("fail", [p("test", 0)], sentinel),
                n("end", []),
            ])
        })
    })
})
