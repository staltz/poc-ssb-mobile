var EE = require('events').EventEmitter;
var inherits = require('inherits');
inherits(Stream, EE);
function Stream() {
  EE.call(this);
}
global.StreamModule = Stream;
Stream.Stream = Stream;
module.exports = Stream;