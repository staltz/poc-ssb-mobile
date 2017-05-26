var cont = require('cont')
var explain = require('explain-error')
var mdm = require('mdmanifest')
var valid = require('scuttlebot/lib/validators')
var ref = require('ssb-ref')
var ssbClient = require('ssb-client')

// invite plugin
// adds methods for producing invite-codes,
// which peers can use to command your server to follow them.

function isFunction (f) {
  return 'function' === typeof f
}

function isString (s) {
  return 'string' === typeof s
}

function isObject(o) {
  return o && 'object' === typeof o
}

module.exports = {
  name: 'invite',
  version: '1.0.0',
  manifest: { create: "async", accept: "async", use: "async" },
  permissions: {
    master: {allow: ['create']},
    //temp: {allow: ['use']}
  },
  init: function (server, config) {
    console.log('custom-invite init');
    var codes = {}
    var codesDB = server.sublevel('codes')

    var createClient = this.createClient

    //add an auth hook.
    server.auth.hook(function (fn, args) {
      var pubkey = args[0], cb = args[1]

      // run normal authentication
      fn(pubkey, function (err, auth) {
        if(err || auth) return cb(err, auth)

        // if no rights were already defined for this pubkey
        // check if the pubkey is one of our invite codes
        codesDB.get(pubkey, function (_, code) {
          //disallow if this invite has already been used.
          if(code && (code.used >= code.total)) cb()
          else cb(null, code && code.permissions)
        })
      })
    })

    return {
      use: valid.async(function (req, cb) {
        console.log('custom-invite use. req:', req);
        var rpc = this

        // fetch the code
        codesDB.get(rpc.id, function(err, invite) {
          if(err) return cb(err)

          // check if we're already following them
          server.friends.all('follow', function(err, follows) {
            if (follows && follows[server.id] && follows[server.id][req.feed])
              return cb(new Error('already following'))

            // although we already know the current feed
            // it's included so that request cannot be replayed.
            if(!req.feed)
              return cb(new Error('feed to follow is missing'))

            if(invite.used >= invite.total)
              return cb(new Error('invite has expired'))

            invite.used ++

            //never allow this to be used again
            if(invite.used >= invite.total) {
              invite.permissions = {allow: [], deny: null}
            }
            //TODO
            //okay so there is a small race condition here
            //if people use a code massively in parallel
            //then it may not be counted correctly...
            //this is not a big enough deal to fix though.
            //-dominic

            // update code metadata
            codesDB.put(rpc.id, invite, function (err) {
              server.emit('log:info', ['invite', rpc.id, 'use', req])

              // follow the user
              server.publish({
                type: 'contact',
                contact: req.feed,
                following: true,
                pub: true
              }, cb)
            })
          })
        })
      }, 'object'),
      accept: valid.async(function (invite, cb) {
        console.log('custom-invite accept. invite:', invite);
        // remove surrounding quotes, if found
        if (invite.charAt(0) === '"' && invite.charAt(invite.length - 1) === '"')
          invite = invite.slice(1, -1)
        var opts
        // connect to the address in the invite code
        // using a keypair generated from the key-seed in the invite code
        var modern = false
        if(ref.isInvite(invite)) { //legacy ivite
          if(ref.isLegacyInvite(invite)) {
            var parts = invite.split('~')
            opts = ref.parseAddress(parts[0])//.split(':')
            //convert legacy code to multiserver invite code.
            invite = 'net:'+opts.host+':'+opts.port+'~shs:'+opts.key.slice(1, -8)+':'+parts[1]
          }
          else
            modern = true
        }

        opts = ref.parseAddress(ref.parseInvite(invite).remote)

        ssbClient(null, {
          remote: invite,
          manifest: {invite: {use: 'async'}, getAddress: 'async'}
        }, function (err, rpc) {
          if(err) return cb(explain(err, 'could not connect to server'))

          // command the peer to follow me
          rpc.invite.use({ feed: server.id }, function (err, msg) {
            if(err) return cb(explain(err, 'invite not accepted'))

            // follow and announce the pub
            cont.para([
              server.publish({
                type: 'contact',
                following: true,
                autofollow: true,
                contact: opts.key
              }),
              (
                opts.host
                ? server.publish({
                    type: 'pub',
                    address: opts
                  })
                : function (cb) { cb() }
              )
            ])
            (function (err, results) {
              if(err) return cb(err)
              rpc.getAddress(function (err, addr) {
                rpc.close()
                //ignore err if this is new style invite
                if(modern && err) return cb(err, addr)
                if(server.gossip) server.gossip.add(addr, 'seed')
                cb(null, results)
              })
            })
          })
        })
      }, 'string')
    }
  }
}
