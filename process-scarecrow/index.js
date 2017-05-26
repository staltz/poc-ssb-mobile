module.exports = global.process = {
  version: '6.0', // pretend like we have Node v6.0
  umask: () => 18,
  cwd: () => '',
  nextTick: setImmediate,
  env: {
    HOME: '/', // used by os-homedir and transitively by ssb-config
  },
  argv: ['react-native', 'run-android', 'poc-android'],
  versions: {},
};