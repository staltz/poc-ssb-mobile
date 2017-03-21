const Rx = require('rxjs')
const path = require('path')
const fs = require('fs')

/**
 * Sets shim in all modules in node_modules, under
 * 'react-native': {'chloride': ...} in package.json.
 */

const readdir$ = Rx.Observable.bindNodeCallback(fs.readdir)
const readFile$ = Rx.Observable.bindNodeCallback(fs.readFile)
const writeFile$ = Rx.Observable.bindNodeCallback(fs.writeFile)

const sink = {
  error: e => console.error(e),
}

const thisPackageJson$ = readFile$('./package.json')
  .map(JSON.parse)
  .merge(Rx.Observable.never())
  .multicast(new Rx.ReplaySubject(1))

thisPackageJson$.connect()

function setChlorideShim(otherJSON) {
  return thisPackageJson$.map(thisPackageJson => {
    otherJSON['react-native'] = thisPackageJson['react-native']
    return otherJSON
  })
}

function log(x) {
  console.log(x)
}

const otherModules = [
  'ssb-client/node_modules/ssb-keys',
  'secret-stack/node_modules/non-private-ip',
  'fwd-stream/node_modules/readable-stream',
  'levelup/node_modules/readable-stream',
  'bl/node_modules/readable-stream',
  'secure-scuttlebutt/node_modules/readable-stream',
  'ssb-ref/node_modules/ip',
  'ssb-config/node_modules/non-private-ip'
];

readdir$('./node_modules')
  .map(modules => modules.concat(otherModules))
  .mergeMap(modules => Rx.Observable.from(modules))
  .map(_module => path.join('./node_modules', _module))
  .filter(_module => fs.statSync(_module).isDirectory())
  .filter(_module => fs.existsSync(path.join(_module, 'package.json')))
  .mergeMap(file => {
    const p = path.join(file, 'package.json')
    return readFile$(p, 'ascii')
      .map(JSON.parse)
      .switchMap(setChlorideShim)
      .map(obj => JSON.stringify(obj, null, '  '))
      .switchMap(json => writeFile$(p, json))
      .do(
        () => console.log('Fixed shims in', p),
        e => console.warn('Failed to process ' + p + ' because ' + e.message)
      )
      .catch(err => Rx.Observable.empty())
  })
  .subscribe(sink)