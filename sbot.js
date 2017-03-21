var SecretStack = require('secret-stack')
var create     = require('secure-scuttlebutt/create')
var ssbKeys    = require('ssb-keys')
var path       = require('path')
var mdm        = require('mdmanifest')
var valid      = require('scuttlebot/lib/validators')
// var apidocs    = require('scuttlebot/lib/apidocs.js')

const manifest = {
  auth: "async",
  address: "sync",
  manifest: "sync",
  get: "async",
  createFeedStream: "source",
  createLogStream: "source",
  messagesByType: "source",
  createHistoryStream: "source",
  createUserStream: "source",
  links: "source",
  relatedMessages: "async",
  add: "async",
  publish: "async",
  getAddress: "sync",
  getLatest: "async",
  latest: "source",
  latestSequence: "async",
  whoami: "sync",
  // usage: "sync",
  gossip: {
    peers: "sync",
    add: "sync",
    remove: "sync",
    ping: "duplex",
    connect: "async",
    changes: "source",
    reconnect: "sync"
  },
  friends: {
    all: "async",
    hops: "async",
    createFriendStream: "source",
    get: "sync"
  },
  replicate: { changes: "source", upto: "source" },
  blobs: {
    get: "source",
    add: "sink",
    ls: "source",
    has: "async",
    size: "async",
    meta: "async",
    want: "async",
    push: "async",
    changes: "source",
    createWants: "source"
  },
  invite: { create: "async", accept: "async", use: "async" },
  block: { isBlocked: "sync" },
  private: {
    publish: "async",
    unbox: "sync",
    read: "source",
    progress: "source"
  },
  query: { read: "source", dump: "source", progress: "source" }
};

// create SecretStack definition
// var manifest = mdm.manifest(apidocs._)
// manifest.usage = 'sync'
var SSB = {
  manifest: manifest,
  permissions: {
    master: {allow: null, deny: null},
    anonymous: {allow: ['createHistoryStream'], deny: null}
  },
  init: function (api, opts) {

    if(!opts.keys)
      opts.keys = ssbKeys.generate('ed25519', opts.seed && new Buffer(opts.seed, 'base64'))

    if(!opts.path)
      throw new Error('opts.path *must* be provided, or use opts.temp=name to create a test instance')

    // main interface
    var ssb = create(path.join(opts.path, 'db'), opts, opts.keys)
    //treat the main feed as remote, because it's likely handled like that by others.
    var feed = ssb.createFeed(opts.keys, {remote: true})
    var _close = api.close
    var close = function (arg, cb) {
      if('function' === typeof arg) cb = arg
      // override to close the SSB database
      ssb.close(function (err) {
        if (err) throw err
        _close()
        cb && cb() //multiserver doesn't take a callback on close.
      })
    }
    return {
      id                       : feed.id,
      keys                     : opts.keys,

      // usage                    : valid.sync(usage, 'string?|boolean?'),
      close                    : valid.async(close),

      publish                  : valid.async(feed.add, 'string|msgContent'),
      add                      : valid.async(ssb.add, 'msg'),
      get                      : valid.async(ssb.get, 'msgId'),

      pre                      : ssb.pre,
      post                     : ssb.post,

      getPublicKey             : ssb.getPublicKey,
      latest                   : ssb.latest,
      getLatest                : valid.async(ssb.getLatest, 'feedId'),
      latestSequence           : valid.async(ssb.latestSequence, 'feedId'),
      createFeed               : ssb.createFeed,
      whoami                   : function () { return { id: feed.id } },
      relatedMessages          : valid.async(ssb.relatedMessages, 'relatedMessagesOpts'),
      query                    : ssb.query,
      createFeedStream         : valid.source(ssb.createFeedStream, 'readStreamOpts?'),
      createHistoryStream      : valid.source(ssb.createHistoryStream, ['createHistoryStreamOpts'], ['feedId', 'number?', 'boolean?']),
      createLogStream          : valid.source(ssb.createLogStream, 'readStreamOpts?'),
      createUserStream         : valid.source(ssb.createUserStream, 'createUserStreamOpts'),
      links                    : valid.source(ssb.links, 'linksOpts'),
      sublevel                 : ssb.sublevel,
      messagesByType           : valid.source(ssb.messagesByType, 'string|messagesByTypeOpts'),
      createWriteStream        : ssb.createWriteStream,
    }
  }
}

const createSbot = SecretStack({appKey: require('scuttlebot/lib/ssb-cap')})
      .use(SSB)
      // .use(require('scuttlebot/plugins/plugins'))
      .use(require('scuttlebot/plugins/master'))
      .use(require('scuttlebot/plugins/gossip'))
      .use(require('scuttlebot/plugins/local'))
      .use(require('scuttlebot/plugins/friends'))
      .use(require('scuttlebot/plugins/replicate'))
      // .use(require('ssb-blobs'))
      .use(require('scuttlebot/plugins/invite'))
      .use(require('scuttlebot/plugins/block'))
      // .use(require('scuttlebot/plugins/logging'))
      .use(require('scuttlebot/plugins/private'));

export default createSbot;
