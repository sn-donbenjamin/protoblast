module.exports = function BlastURL(Blast, Collection) {

	var queryString;

	/**
	 * The URL class is present on all modern browsers.
	 * It is not in node.js or IE9
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 */
	Blast.defineClass('URL', function URL(url) {

		var auth;

		// These should always be filled in
		this.href = null;
		this.protocol = null;
		this.host = null;
		this.hostname = null;
		this.pathname = null;

		// These could be empty, but should not be null
		this.search = '';
		this.username = '';
		this.password = '';
		this.hash = '';
		this.port = '';

		// Parse the url
		this.parse(url);

		// Add the origin
		this.origin = this.protocol + '//' + this.hostname;

		// 'auth' is not used on the browser
		if (this.auth) {
			auth = this.auth.split(':');
			this.username = auth[0];
			this.password = auth[1] || '';

			// Unset auth
			this.auth = undefined;
		}

		// These are properties that are not in the browser,
		// so we shouldn't use them in node either
		this.path = undefined;
		this.query = undefined;
		this.slashes = undefined;

	}, true);

	// Add the URL-module prototype methods
	if (Blast.isNode) {
		Blast.Classes.URL.prototype = Object.create(require('url').Url.prototype);
	}

	/**
	 * Parse a url string.
	 * Same as 'new Url()'
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   url
	 *
	 * @return   {URL}
	 */
	Blast.defineStatic('URL', 'parse', function parse(url) {
		return new Blast.Classes.URL(url);
	});

	/**
	 * Return the URL as a string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('URL', 'toString', function toString() {

		var result = this.protocol + '//';

		if (this.username) {
			result += this.username;

			if (this.password) {
				result += ':' + this.password;
			}

			result += '@';
		}

		result += this.hostname;

		if (this.port) {
			result += ':' + this.port;
		}

		result += this.pathname;
		result += this.search;
		result += this.hash;

		return result;
	});

	/**
	 * Add get parameters to the URL object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String|Object}   params
	 *
	 * @return   {String}
	 */
	Blast.definePrototype('URL', 'addQuery', function addQuery(params) {

		var query;

		// If no valid parameters are given, do nothing
		if (!params) {
			return;
		}

		if (typeof params === 'string') {
			// The params should not start with a question mark or an ampersand
			if (params[0] === '?' || params[1] === '&') {
				query = params.slice(1);
			} else {
				query = params;
			}
		} else {
			query = Collection.Bound.URL.encodeQuery(params);
		}

		if (this.search) {
			this.search += '&';
		} else {
			this.search = '?';
		}

		this.search += query;
	});

	// Don't do the rest if we're not running on node
	if (!Blast.isNode) {
		return;
	}

	// Get the querystring module
	queryString = require('querystring');

	/**
	 * Serialize an object to a query string
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {Object}   obj
	 * @param    {String}   sep
	 * @param    {String}   eq
	 * @param    {Object}   options
	 *
	 * @return   {String}
	 */
	Blast.defineStatic('URL', 'encodeQuery', queryString.encode);

	/**
	 * Parse a query string to an object
	 *
	 * @author   Jelle De Loecker   <jelle@codedor.be>
	 * @since    0.1.3
	 * @version  0.1.3
	 *
	 * @param    {String}   str
	 * @param    {String}   sep
	 * @param    {String}   eq
	 * @param    {Object}   options
	 *
	 * @return   {Object}
	 */
	Blast.defineStatic('URL', 'parseQuery', queryString.parse);

};