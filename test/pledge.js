var assert = require('assert'),
    Blast;

describe('Pledge', function() {

	before(function() {
		Blast  = require('../index.js')();
	});

	describe('.constructor(executor)', function() {

		it('should create a new pledge without an executor', function() {
			var pledge = new Blast.Classes.Pledge();
		});

		it('should pass a resolve & reject function to the executor', function(done) {
			var pledge = new Blast.Classes.Pledge(function myExecutor(resolve, reject) {
				assert.equal(typeof resolve, 'function');
				assert.equal(typeof reject, 'function');
				done();
			});
		});
	});

	describe('#then(on_fulfilled, on_rejected)', function() {

		it('should call the on_fulfilled function when it is resolved', function(done) {

			var pledge = new Blast.Classes.Pledge();

			pledge.then(function resolved(value) {
				assert.equal(value, 99);
				done();
			});

			setTimeout(function() {
				pledge.resolve(99);
			}, 10);
		});

		it('should throw errors if nothing is there to catch it', function(finished) {

			var pledge = new Blast.Classes.Pledge();

			pledge.then(function resolved(value) {
				throw new Error('Catch it')
			}).catch(function gotError(err) {
				assert.equal(err.message, 'Catch it');
				finished();
			});

			pledge.resolve();
		});
	});

	describe('#handleCallback(callback)', function() {

		it('should call the callback when resolving or rejecting', function() {
			var pledge = new Blast.Classes.Pledge();

			pledge.handleCallback(function done(err, result) {
				assert.equal(err.message, 'TEST');
			});

			pledge.reject(new Error('TEST'));

			var pledge_two = new Blast.Classes.Pledge();

			pledge_two.handleCallback(function done(err, result) {
				assert.equal(result, 'result');
			});

			pledge_two.resolve('result');
		});

		it('should ignore falsy values', function() {
			var pledge = new Blast.Classes.Pledge();

			pledge.handleCallback(null);
			pledge.handleCallback(false);
			pledge.handleCallback(0);
			pledge.handleCallback('');
		});
	});
});