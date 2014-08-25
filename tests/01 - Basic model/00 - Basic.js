var api = require('../../');
var assert = require('chai').assert;

describe('Basic model', function () {
	it('creation, set/get', function () {
		var model = api.create({foo:'bar'});
		
		assert.deepEqual(model.get('foo'), 'bar');
		assert.deepEqual(model.get('/foo'), 'bar');
		model.set('/foo', 'baz');
		assert.deepEqual(model.get('foo'), 'baz');
	});
	
	it('has prop(), keys()', function () {
		var model = api.create({foo:'bar'});
		
		assert.deepEqual(model.keys(), ['foo']);
		assert.deepEqual(model.get('foo'), model.prop('foo').get());
		assert.deepEqual(model.prop('foo').pointer(), '/foo');
	});

	it('has item(), length()', function () {
		var model = api.create([0, 1, 2]);
		
		assert.deepEqual(model.length(), 3);
		assert.deepEqual(model.get(1), model.item(1).get());
	});

	it('has path()', function () {
		var model = api.create([0, 1, 2]);
		
		assert.equal(model.path('/0'), model.item(0));
	});
	
	it('schemas', function () {
		var schemaUrl = '/schemas/test' + Math.random();
		api.schemaStore.add(schemaUrl, {
			type: 'object', 
			properties: {
				'foo': {type: 'string'},
				'bar': {type: 'integer'}
			}
		});
		
		var model = api.create({foo: 'hello'}, [schemaUrl]);
		
		assert.deepEqual(model.schemas(), [schemaUrl]);
		assert.deepEqual(model.schemas('foo'), [schemaUrl + '#/properties/foo']);
		assert.deepEqual(model.schemas('foo'), model.prop('foo').schemas());
		
		assert.isTrue(model.hasSchema(schemaUrl));
		assert.isFalse(model.hasSchema(schemaUrl + '1234'));
		assert.isTrue(model.hasSchema('/foo', schemaUrl + '#/properties/foo'));
	});

	it('missing schema', function (done) {
		var schemaUrl = '/schemas/test' + Math.random();
		var requestParams = [];
		api.setRequestFunction(function (params, callback) {
			api.setRequestFunction(null);
			assert.deepEqual(params.url, schemaUrl, 'request correct URL');
			
			requestParams.push(params);
			assert.deepEqual(requestParams.length, 1, 'only one request made');

			setTimeout(function () {
				// Have to delay callback so can check pre-callback schema assignment
				callback(null, {
					type: 'object',
					properties: {
						'foo': {type: null}
					}
				});
				
				// After callback called
				assert.deepEqual(model.schemas().length, 1);
				assert.deepEqual(model.schemas('foo'), [schemaUrl + '#/properties/foo']);
				assert.deepEqual(model.errors().length, 0);
				done();
			}, 10);
		});
		
		assert.isTrue(api.schemaStore.missing(schemaUrl));
		var missing = api.schemaStore.missing();
		assert.notInclude(missing, schemaUrl, 'schemaUrl in missing');
		
		var model = api.create({foo: 'hello'}, [schemaUrl]);
		
		missing = api.schemaStore.missing();
		assert.include(missing, schemaUrl, 'schemaUrl in missing');
		
		// Before callback called
		assert.deepEqual(model.schemas().length, 1);
		assert.deepEqual(model.schemas('foo').length, 0);
		assert.deepEqual(model.errors().length, 0);
	});

	it('toJSON()', function () {
		var model = api.create({foo: 'hello'});
		
		assert.deepEqual(JSON.stringify(model), JSON.stringify(model.get()));
	});

	it('api.extend()', function () {
		var model = api.create({foo: 'hello'});
		
		api.extend({
			foo: function () {return 'bar';}
		});
		
		assert.equal(model.foo(), 'bar');
	});
});