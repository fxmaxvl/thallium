#!/usr/bin/env node
"use strict"

/* eslint-env node */
/* eslint-disable no-process-exit */
// This script loads Thallium, and respawns Node if necessary with the proper
// CLI flags (if other arguments are passed).

if (require.main !== module) {
    throw new Error("This is not a module!")
}

var path = require("path")
var fs = require("fs")
var parse = require("../lib/cli/parse.js")
var args = parse(process.argv.slice(2))

// If help is requested, print it now.
if (args.help) {
    var file = args.help === "detailed"
        ? "help-detailed.txt"
        : "help-simple.txt"

    var text = fs.readFileSync(
        path.resolve(__dirname, "../lib/cli", file),
        "utf-8")

    // Pad the top by a line.
    console.log()
    console.log(
        process.platform === "win32"
            ? text.replace("\n", "\r\n")
            : text)
    process.exit()
}

function resolveModule(cwd, name) {
    if (args.forceLocal) return path.resolve(__dirname, "../lib/cli", name)

    var resolve = require("resolve") // eslint-disable-line global-require

    try {
        return resolve.sync(path.join("thallium/lib/cli", name), {basedir: cwd})
    } catch (_) {
        return path.resolve(__dirname, "../lib/cli", name)
    }
}

if (args.respawn && args.unknown.length !== 0) {
    // If we have unknown flags (and respawning isn't disabled), respawn Node
    // with the unknown flags passed directly to it.
    //
    // The reason unknown flags (any that Thallium doesn't understand) are
    // passed directly to it is because V8 changes its flags between even minor
    // releases. Between that and the relative difficulty of figuring out what
    // flags are actually supported by V8 (`v8flags`' module implementation is
    // non-trivial), is why I just let Node figure out the rest. Worst case
    // scenario, Node complains about a bad option and errors out.
    var flags = args.unknown.concat([__filename])

    if (args.color != null) flags.push(args.color ? "--color" : "--no-color")
    if (args.config != null) flags.push("--config", args.config)
    if (args.cwd != null) flags.push("--cwd", args.cwd)

    for (var i = 0; i < args.require.length; i++) {
        flags.push("--require", args.require[i])
    }

    // It shouldn't respawn again in the child process, but I added the flag
    // here just in case.
    flags.push("--no-respawn", "--")
    flags.push.apply(flags, args.files)

    // If only I could literally substitute the process...
    var cp = require("child_process") // eslint-disable-line global-require

    cp.spawn(process.argv[0], flags, {stdio: "inherit"})
    .on("exit", function (code) { if (code != null) process.exit(code) })
    .on("close", function (code) { if (code != null) process.exit(code) })
} else {
    // Uncomment to log all FS calls.
    // require("../scripts/log-fs.js")

    // Resolve the full path first, and prefer a local installation to a global
    // one if possible.
    /* eslint-disable global-require */

    var cwd = args.cwd != null ? path.resolve(args.cwd) : process.cwd()
    var Run = require(resolveModule(cwd, "run.js"))
    var Util = require(resolveModule(cwd, "util.js"))

    /* eslint-enable global-require */

    Run.run(args, Util)
    .catch(function (e) {
        console.error(e.stack)
        return 1
    })
    .then(process.exit)
}