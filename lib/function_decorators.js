module.exports = function BlastDecorators(Blast, Collection) {

	var cache_key = Symbol('memoize_cache');

	Blast.Decorators = {};

	/**
	 * Method memoizer using the Cache class
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.0
	 * @version  0.6.0
	 *
	 * @param    {Object}   config
	 */
	Blast.Decorators.memoize = function memoize(config) {
		if (!config) {
			config = {};
		}

		config.cache_class = config.cache_class || Blast.Classes.Develry.Cache;
		config.cache_key   = config.cache_key   || cache_key;
		config.max_length  = config.max_length  || 15;

		return function memoizer(options) {

			var descriptor = options.descriptor,
			    method     = descriptor.value;

			// Overwrite the value
			descriptor.value = (function() {

				var callback,
				    checksum,
				    context,
				    result,
				    found,
				    cache,
				    last = arguments.length - 1,
				    args,
				    key;

				if (config.ignore_callbacks && typeof arguments[last] == 'function') {
					callback = arguments[last];
					args = Array.prototype.slice.call(arguments, 0, last);
				} else {
					args = Array.prototype.slice.call(arguments, 0);
				}

				checksum = Object.checksum(args, false);
				key = 'mem_' + options.key + '_' + checksum;

				if (config.static) {
					context = this.constructor;
				} else {
					context = this;
				}

				if (!context[config.cache_key]) {
					context[config.cache_key] = new config.cache_class({max_length: config.max_length});
				}

				cache = context[config.cache_key];

				if (cache.has(key)) {
					result = cache.get(key);
					found = true;
				}

				if (callback) {

					// If the value was already found, callback on the next tick
					if (found) {
						if (result && result.then) {
							result.then(function done(value) {
								callback.apply(null, value);
							});

							return;
						} else {
							return Blast.nextTick(function() {
								callback.apply(null, result);
							});
						}
					}

					// Not yet found, so add an intercepted callback
					args.push(function interceptCallback(err) {

						if (err) {
							cache.set(key, [err]);
							return callback(err);
						}

						cache.set(key, arguments);
						callback.apply(null, arguments);
						pledge.resolve(arguments);
					});

					let pledge = new Blast.Classes.Pledge();
					cache.set(key, pledge);

					return method.apply(this, args);
				} else if (!found) {
					result = method.apply(this, args);
					cache.set(key, result, config.max_age);
				}

				return result;
			});

			return options;
		};
	};

	/**
	 * Method throttler
	 *
	 * @author   Jelle De Loecker   <jelle@develry.be>
	 * @since    0.6.2
	 * @version  0.6.2
	 *
	 * @param    {Object|Number}   config   Config object or timeout in ms
	 */
	Blast.Decorators.throttle = function throttle(config) {

		if (typeof config == 'number') {
			config = {
				minimum_wait : config
			};
		} else if (!config) {
			config = {};
		}

		config.minimum_wait  = config.minimum_wait  || 5;
		config.immediate     = config.immediate     || false;
		config.reset_on_call = config.reset_on_call || false;

		if (config.method == null) {
			config.method = true;
		}

		return function throttler(options) {

			var descriptor = options.descriptor;

			// Overwrite the value
			descriptor.value = Collection.Function.throttle(descriptor.value, config);

			return options;
		};
	};

};