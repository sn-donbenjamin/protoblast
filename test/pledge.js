var assert = require('assert'),
    Blast,
    Pledge;

describe('Pledge', function() {

	before(function() {
		Blast  = require('../index.js')();
		Pledge = Blast.Classes.Pledge;
	});

	describe('.constructor(executor)', function() {

		it('should create a new pledge without an executor', function() {
			var pledge = new Pledge();
		});

		it('should pass a resolve & reject function to the executor', function(done) {
			var pledge = new Pledge(function myExecutor(resolve, reject) {
				assert.equal(typeof resolve, 'function');
				assert.equal(typeof reject, 'function');
				done();
			});
		});
	});

	describe('.resolve(value)', function() {
		it('should return a pledge that gets resolved asynchronously', function(done) {

			var pledge = Pledge.resolve('some_value');

			assert.equal(pledge.state, 0);

			pledge.then(function _done(value) {
				assert.equal(value, 'some_value');
				assert.equal(pledge.state, 1);
				done();
			});
		});
	});

	describe('.reject(err)', function() {
		it('should return a pledge that gets rejected asynchronously', function(done) {

			var pledge = Pledge.reject(new Error('Bla'));

			assert.equal(pledge.state, 0);

			pledge.catch(function _done(err) {
				assert.equal(err.constructor.name, 'Error');
				assert.equal(pledge.state, 2);
				done();
			});
		});
	});

	describe('.all', function() {
		it('throws on implicit undefined', function() {
			return Pledge.all().then(
				function() {
					assert.fail();
				},
				function(error) {
					console.log
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on explicit undefined', function() {
			return Pledge.all(undefined).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on null', function() {
			return Pledge.all(null).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on 0', function() {
			return Pledge.all(0).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on false', function() {
			return Pledge.all(false).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on a number', function() {
			return Pledge.all().then(
				function() {
					assert.fail(20);
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on a boolean', function() {
			return Pledge.all(true).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});
		it('throws on an object', function() {
			return Pledge.all({ test: 'object' }).then(
				function() {
					assert.fail();
				},
				function(error) {
					assert.ok(error instanceof Error);
				}
			);
		});

		it('should resolve all with zero promises', function (done) {
			Pledge.all([]).then(function (x) {
				assert.deepEqual(x, []);
				done();
			});
		});

		it('should return all resolved promises', function (done) {
			Pledge.all([Pledge.resolve('hello'), Pledge.resolve('world')]).then(function (x) {
				assert.deepEqual(x, ['hello', 'world']);
				done();
			});
		});

		it('should reject the promise if one of all is rejected', function (done) {
			Pledge.all([Pledge.resolve('hello'), Pledge.reject('bye')]).then(function () {}, function (r) {
				assert.equal(r, 'bye');
				done();
			});
		});

		it('should return all promises in order with delays', function (done) {
			Pledge.all([new Pledge(function (resolve) {
				setTimeout(function () {
					resolve('hello');
				}, 50);
			}), Pledge.resolve('world')]).then(function (x) {
				assert.deepEqual(x, ['hello', 'world']);
				done();
			});
		});

		it('should convert a non-promise to a promise', function (done) {
			Pledge.all(['hello', Pledge.resolve('world')]).then(function (x) {
				assert.deepEqual(x, ['hello', 'world']);
				done();
			});
		});
	});

	describe('#then(on_fulfilled, on_rejected)', function() {

		it('should call the on_fulfilled function when it is resolved', function(done) {

			var pledge = new Pledge();

			pledge.then(function resolved(value) {
				assert.equal(value, 99);
				done();
			});

			setTimeout(function() {
				pledge.resolve(99);
			}, 10);
		});

		it('should throw errors if nothing is there to catch it', function(finished) {

			var pledge = new Pledge();

			pledge.then(function resolved(value) {
				throw new Error('Catch it')
			}).catch(function gotError(err) {
				assert.equal(err.message, 'Catch it');
				finished();
			});

			pledge.resolve();
		});
	});

	describe('#finally(on_finally)', function() {
		it('should be called on success', function(done) {
			Pledge.resolve(3).finally(function() {
				assert.equal(arguments.length, 0, 'No arguments to onFinally');
				done();
			});
		});

		it('should be called on failure', function(done) {
			Pledge.reject(new Error('Finally error test')).finally(function() {
				assert.equal(arguments.length, 0, 'No arguments to onFinally');
				done();
			});
		});

		it('should not affect the result', function(done) {
			Pledge.resolve(3)
				.finally(function() {
					return 'dummy';
				})
				.then(function(result) {
					assert.equal(result, 3, 'Result was the resolved result');
					return Pledge.reject(new Error('test'));
				})
				.finally(function() {
					return 'dummy';
				})
				.catch(function(reason) {
					assert(!!reason, 'There was a reason');
					assert.equal(reason.message, 'test', 'We catched the correct error');
				})
				.finally(done);
		});

		it('should reject with the handler error if handler throws', function(done) {
			Pledge.reject(new Error('test2'))
				.finally(function() {
					throw new Error('test3');
				})
				.catch(function(reason) {
					assert.equal(reason.message, 'test3', 'The handler error was caught');
				})
				.finally(done);
		});

		it('should await any promise returned from the callback', function(done) {
			var log = [];
			Pledge.resolve()
				.then(function() {
					log.push(1);
				})
				.finally(function() {
					return Pledge.resolve()
						.then(function() {
							log.push(2);
						})
						.then(function() {
							log.push(3);
						});
				})
				.then(function() {
					log.push(4);
				})
				.then(function() {
					assert.deepEqual(log, [1, 2, 3, 4], 'Correct order of promise chain');
				})
				.catch(function(err) {
					assert(false, err);
				})
				.finally(done);
		});
	});

	describe('#handleCallback(callback)', function() {

		it('should call the callback when resolving or rejecting', function() {
			var pledge = new Pledge();

			pledge.handleCallback(function done(err, result) {
				assert.equal(err.message, 'TEST');
			});

			pledge.reject(new Error('TEST'));

			var pledge_two = new Pledge();

			pledge_two.handleCallback(function done(err, result) {
				assert.equal(result, 'result');
			});

			pledge_two.resolve('result');
		});

		it('should ignore falsy values', function() {
			var pledge = new Pledge();

			pledge.handleCallback(null);
			pledge.handleCallback(false);
			pledge.handleCallback(0);
			pledge.handleCallback('');
		});
	});
});