global.Buffer = require('buffer').Buffer;
global.process = {
  version: '6.0', // pretend like we have Node v6.0
  umask: () => 18,
  cwd: () => '',
  nextTick: setImmediate,
  env: {},
};