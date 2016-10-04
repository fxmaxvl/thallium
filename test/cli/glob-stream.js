"use strict"

/* eslint max-nested-callbacks: [2, 5] */

var through2 = require("through2")
var fixture = require("../../scripts/cli.js").fixture
var GS = require("../../lib/cli/glob-stream.js")

describe("cli glob stream", function () {
    describe("addStream()", function () {
        it("throws error if stream is not readable", function () {
            var stream = through2.obj()
            var list = [{readable: false}]

            assert.throwsMatch(function () {
                GS.addStream(Object.create(null), stream, list, list[0])
            }, "All input streams must be readable")
        })

        it("emits data from all streams", function (done) {
            var s1 = through2.obj()
            var s2 = through2.obj()
            var s3 = through2.obj()
            var streams = [s1, s2, s3]
            var combined = through2.obj()
            var results = []

            streams.forEach(function (stream) {
                GS.addStream(Object.create(null), combined, streams, stream)
            })

            combined.on("data", function (data) {
                results.push(data)
            })

            combined.on("end", function () {
                assert.match(results, [
                    "stream 1",
                    "stream 2",
                    "stream 3",
                ])
                done()
            })

            s1.write("stream 1")
            s1.end()

            s2.write("stream 2")
            s2.end()

            s3.write("stream 3")
            s3.end()
        })

        it("emits all data event from each stream", function (done) {
            var s = through2.obj()
            var combined = through2.obj()
            var results = []

            GS.addStream(Object.create(null), combined, [s], s)

            combined.on("data", function (data) {
                results.push(data)
            })

            combined.on("end", function () {
                assert.match(results, [
                    "data1",
                    "data2",
                    "data3",
                ])
                done()
            })

            s.write("data1")
            s.write("data2")
            s.write("data3")
            s.end()
        })

        it("preserves streams order", function (done) {
            function delay(ms) {
                return /** @this */ function (data, enc, next) {
                    var self = this

                    Util.setTimeout(function () {
                        self.push(data)
                        next()
                    }, ms)
                }
            }
            var s1 = through2.obj(delay(200))
            var s2 = through2.obj(delay(30))
            var s3 = through2.obj(delay(100))
            var streams = [s1, s2, s3]
            var combined = through2.obj()
            var results = []

            streams.forEach(function (stream) {
                GS.addStream(Object.create(null), combined, streams, stream)
            })

            combined.on("data", function (data) {
                results.push(data)
            })
            combined.on("end", function () {
                assert.match(results, [
                    "stream 1",
                    "stream 2",
                    "stream 3",
                ])
                done()
            })

            s1.write("stream 1")
            s1.end()

            s2.write("stream 2")
            s2.end()

            s3.write("stream 3")
            s3.end()
        })

        it("emits stream errors downstream", function (done) {
            var s1 = through2.obj(/** @this */ function (data, enc, next) {
                this.emit("error", new Error("stop"))
                next()
            })
            var s2 = through2.obj()

            var error
            var streamData = []
            var streams = [s1, s2]
            var combined = through2.obj()

            GS.addStream(Object.create(null), combined, streams, s1)
            GS.addStream(Object.create(null), combined, streams, s2)

            combined.on("data", function (data) {
                streamData.push(data)
            })
            combined.on("error", function (err) {
                error = err
            })
            combined.on("end", function () {
                assert.hasOwn(error, "message", "stop")
                assert.match(streamData, ["okay"])
                done()
            })

            s1.write("go")
            s1.end()
            s2.write("okay")
            s2.end()
        })
    })

    describe("create() (FLAKE)", function () { // eslint-disable-line max-statements, max-len
        var oldCwd = process.cwd()

        beforeEach(function () {
            process.chdir(__dirname)
        })

        afterEach(function () {
            process.chdir(oldCwd)
        })

        function read(globs) {
            return new Util.Promise(function (resolve, reject) {
                var stream = GS.create(globs)
                var list = []

                stream.on("error", reject)
                stream.on("data", function (file) {
                    list.push(file)
                })
                stream.on("end", function () {
                    resolve(list)
                })
            })
        }

        it("doesn't emit single folders", function () {
            return read([fixture("glob-stream/whatsgoingon")])
            .then(function (list) {
                assert.match(list, [])
            })
        })

        it("doesn't emit glob folders", function () {
            return read([fixture("glob-stream/whatsgoingon/*/")])
            .then(function (list) {
                assert.match(list, [])
            })
        })

        it("returns a file name stream from a glob", function () {
            return read([fixture("glob-stream/*.coffee")])
            .then(function (list) {
                assert.match(list, [fixture("glob-stream/test.coffee")])
            })
        })

        it("returns a file name stream that does not duplicate", function () {
            return read([
                fixture("glob-stream/test.coffee"),
                fixture("glob-stream/test.coffee"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/test.coffee")])
            })
        })

        it("returns a file name stream from a direct path", function () {
            return read([fixture("glob-stream/test.coffee")])
            .then(function (list) {
                assert.match(list, [fixture("glob-stream/test.coffee")])
            })
        })

        it("returns no files with dotfiles", function () {
            return read([fixture("glob-stream/*swag")]).then(function (list) {
                assert.match(list, [])
            })
        })

        it("returns a correctly ordered file name stream for three globs + globstars", function () { // eslint-disable-line max-len
            return read([
                fixture("glob-stream/**/test.txt"),
                fixture("glob-stream/**/test.coffee"),
                fixture("glob-stream/**/test.js"),
            ]).then(function (list) {
                assert.match(list, [
                    fixture("glob-stream/whatsgoingon/hey/isaidhey/whatsgoingon/test.txt"), // eslint-disable-line max-len
                    fixture("glob-stream/test.coffee"),
                    fixture("glob-stream/whatsgoingon/test.js"),
                ])
            })
        })

        it("returns a correctly ordered file name stream for two globs", function () { // eslint-disable-line max-len
            var globArray = [
                fixture("glob-stream/whatsgoingon/hey/isaidhey/whatsgoingon/test.txt"), // eslint-disable-line max-len
                fixture("glob-stream/test.coffee"),
                fixture("glob-stream/whatsgoingon/test.js"),
            ]

            return read(globArray).then(function (list) {
                assert.match(list, globArray)
            })
        })

        it("returns a input stream for multiple globs + negation (globbing)", function () { // eslint-disable-line max-len
            return read([
                fixture("glob-stream/stuff/*.dmc"),
                "!" + fixture("glob-stream/stuff/test.dmc"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/stuff/run.dmc")])
            })
        })

        it("returns a input stream for multiple globs + negation (direct)", function () { // eslint-disable-line max-len
            return read([
                fixture("glob-stream/stuff/run.dmc"),
                "!" + fixture("glob-stream/stuff/test.dmc"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/stuff/run.dmc")])
            })
        })

        it("returns a file name stream with negation from a glob", function () {
            return read([
                fixture("glob-stream/**/*.js"),
                "!" + fixture("**/test.js"),
            ]).then(function (list) {
                assert.match(list, [])
            })
        })

        it("returns a file name stream from two globs and a negative", function () { // eslint-disable-line max-len
            return read([
                fixture("glob-stream/*.coffee"),
                fixture("glob-stream/whatsgoingon/*.coffee"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/test.coffee")])
            })
        })

        it("respects the globs array order", function () {
            return read([
                fixture("glob-stream/stuff/*"),
                "!" + fixture("glob-stream/stuff/*.dmc"),
                fixture("glob-stream/stuff/run.dmc"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/stuff/run.dmc")])
            })
        })

        it("ignores leading negative globs", function () {
            return read([
                "!" + fixture("glob-stream/stuff/*.dmc"),
                fixture("glob-stream/stuff/run.dmc"),
            ]).then(function (list) {
                assert.match(list, [fixture("glob-stream/stuff/run.dmc")])
            })
        })

        it("throws on invalid glob argument", function () {
            assert.throwsMatch(function () {
                GS.create([42])
            }, /Invalid glob .* 0/)

            assert.throwsMatch(function () {
                GS.create([".", 42])
            }, /Invalid glob .* 1/)
        })

        it("throws on missing positive glob", function () {
            assert.throwsMatch(function () {
                GS.create(["!c"])
            }, /Missing positive glob/)

            assert.throwsMatch(function () {
                GS.create(["!a", "!b"])
            }, /Missing positive glob/)
        })

        it("warns on singular glob when file not found", function (done) {
            var stream = GS.create(["notfound"])
            var warned = false

            stream.on("data", function () {})
            stream.on("warn", function (str) {
                warned = true
                assert.string(str)
            })
            stream.on("error", done)
            stream.on("end", function () {
                done(warned ? null : new Error("A warning was expected"))
            })
        })

        it("warns when multiple globs not found", function (done) {
            var stream = GS.create([
                "notfound",
                fixture("glob-stream/stuff/foo.js"),
            ])
            var warned = false

            stream.on("data", function () {})
            stream.on("warn", function (str) {
                warned = true
                assert.string(str)
            })
            stream.on("error", done)
            stream.on("end", function () {
                done(warned ? null : new Error("A warning was expected"))
            })
        })

        it("warns when one of many globs is not found", function (done) {
            var stream = GS.create([
                "notfound",
                fixture("glob-stream/stuff/*.dmc"),
            ])
            var warned = false

            stream.on("data", function () {})
            stream.on("warn", function (str) {
                warned = true
                assert.string(str)
            })
            stream.on("error", done)
            stream.on("end", function () {
                done(warned ? null : new Error("A warning was expected"))
            })
        })

        it("emits no error on glob containing {} when not found", function () {
            return read(["notfound{a,b}"]).then(function (list) {
                assert.match(list, [])
            })
        })
    })
})
