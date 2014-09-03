var ObjectBuilder = (function($) {
	var builders = {};

	/**
	 * Generates a function that can be used to call a function in the
	 * current object context
	 */
	function rFunc(func, context, include) {
		// Create an array out of the other pass arguments
		var a = Array.prototype.slice.call(arguments);
		// Shift to remove func
		a.shift();
		// Shift to remove context
		a.shift();
		// Shift to remove include
		a.shift();
		return function () {
			/**
			 * Append the arguments from the function call to the arguments
			 * given when rFunc was called.
			 */
			if (include) {
				a = a.concat(Array.prototype.slice.call(arguments));
			}
			func.apply(context, a);
		};
	}

	function sortableStop(id, e, ui) {
		// Find the item
		var i;
		var type = ui.item.attr('data-type');
		var element = ui.item.attr('data-element');
		var elements = builders[id]['elements'][type];
		var item = elements['elements'][element];
		console.log(type);
		console.log(element);
		console.log(item);
		if (!ui.item.attr('data-drawn')) {
			// Find draw function
			var draw = (item['draw'] ? item['draw'] : (elements['draw'] ? elements['draw'] : null));
			if (draw) {
				var pads = draw(ui.item, id);
				if (pads) {
					console.log(pads);
					for (i in pads) {
						console.log('making ' + i + 'sortable');
						pads[i].sortable(builders[id].sortableOptions);
					}
				}
				ui.item.attr('data-drawn', true);
			} else { // Draw using internal function
				ui.item.attr('data-value', item['value']);
			}
		}

		// Reconnect pads
		connectPads(id);

		// Parse object
		if (builders[id].input) {
			builders[id].input.val(ObjectBuilder.getObjectJSON(id));
		}

		// Run onchange if we have one
		if (builders[id].options.onchange) {
			builders[id].options.onchange(id);
		}
	}

	function populateStore(id) {
		if (builders[id]) {
			var e, type, i, item, part;
			var z, y, x, w;
			for (e in builders[id]['elements']) {
				type = builders[id]['elements'][e];
				if (!type['elements']) {
					continue;
				}

				if (type['label']) {
					builders[id]['store'].append((z = $(document.createElement('label'))));
					z.html(type['label']);
				}
				builders[id]['store'].append((z = $(document.createElement('div'))));
				builders[id].stores[e] = z;
				for (i in type['elements']) {
					item = type['elements'][i];

					z.append((y = $(document.createElement('div'))));
					y.addClass('item');
					if (part = (item['className'] ? item['className'] : (type['className'] ? type['className'] : false))) {
						y.addClass(part);
					}
					y.attr('data-type', e);
					y.attr('data-element', i);
					y.html((item['label'] ? item['label'] : i));
				}
			}
		}
	}

	function connectPads(id) {
		console.log('connecting pads');
		if (builders[id]) {
			console.log('valid builder');
			var i, storeTypes = {all: $()};

			for (i in builders[id].pads) {
				console.log('Checking pad');
				// Check if is full
				var max = (builders[id].pads[i].multiple ? builders[id].pads[i].multiple : 1);
				console.log('Pad has a limit of ' + max);
				if (max !== true) {
					console.log('Currently has ' + builders[id].pads[i].pad.children('.item').length);
					if (builders[id].pads[i].pad.children('.item').length >= max) {
						console.log('Pad is full');
						continue;
					}
				}
				if (!builders[id].pads[i].types) {
					console.log('Adding pad to all selector');
					builders[id].pads[i].pad.attr('data-selector', 'all');
					storeTypes.all = storeTypes.all.add(builders[id].pads[i].pad);
				}
			}

			for (i in builders[id].stores) {
				console.log('connecting store ' + i);
				// Add pads that accept all to the specific pads
				if (!storeTypes[i]) {
					console.log('no specifics, adding all');
					storeTypes[i] = storeTypes.all;
				} else {
					console.log('appending all');
					storeTypes[i].add(storeTypes.all);
				}

				storeTypes[i].attr('data-' + i, 'connected');
				builders[id].stores[i].find('.item').draggable('option', 'connectToSortable', storeTypes[i]);
				builders[id].stores[i].find('.item').attr('data-added', 'added');
			}
		}
	}

	return {
		create: function(obj, elements, options) {
			var z, pad = {};

			id = (new Date().getTime()).toString(16);
			
			builders[id] = {
				obj: obj,
				store: null, // Stores the store jQuery DOM container
				stores: {}, // Stores the jQuery DOM container for each type of element
				elements: elements,
				input: null,
				options: options,
				pad: null, // Stores the pad jQuery DOM container used to start the object build process
				pads: [],
				removalIntent: false, // Used to remove determine whether an item should be removed from the object
				sortableOptions: {
					over: function (event, ui) {
						builders[id].removalIntent = false;
						if (!ui.item.hasClass('remove')) {
							ui.item.addClass('remove');
						}
					},
					out: function (event, ui) {
						builders[id].removalIntent = true;
						if (ui.item.hasClass('remove')) {
							ui.item.removeClass('remove');
						}
					},
					beforeStop: function (event, ui) {
						if(builders[id].removalIntent == true){
							ui.item.remove();   
						} else if (ui.item.hasClass('remove')) {
							ui.item.removeClass('remove');
						}
					},
					stop: rFunc(sortableStop, this, true, id)
				}
			};

			if (options.input) {
				builders[id].input = options.input;
			}

			// Create divs
			obj.append((builders[id]['store'] = $(document.createElement('div'))));
			builders[id]['store'].addClass('store');

			builders[id]['pad'] = this.createPad(id, obj, builders[id].options);

			// Populate the store
			populateStore(id);

			builders[id]['store'].find('.item').draggable({
				appendTo: obj,
				helper: 'clone',
				connectToSortable: builders[id]['pad']
			});

			// Connect pads
			connectPads(id);

			return id;
		},
		
		parseObject: function(id) {
			if (builders[id]) {
				return ObjectBuilder.parsePadObject(id, builders[id]['pad']);
			}
		},

		parsePadObject: function(id, pad) {
			if (builders[id] && pad) {
				var e, obj = [], elements = builders[id].elements;

				pad.children('[data-element]').each(function() {
					// Check for a getObject function
					var type = $(this).attr('data-type');
					var element = $(this).attr('data-element');
					if (elements[type] && elements[type].elements[element]) {
						var parseObject 
						if (parseObject = (elements[type].elements[element].parseObject ? elements[type].elements[element].parseObject : (elements[type].parseObject ? elements[type].parseObject : null))) {
							obj.push(parseObject(type, element, $(this), id));
						} else {
							obj.push({
								type: type,
								element: element,
							});
						}
					}
				});

				return obj;
			}
		},
		
		getObjectJSON: function (id) {
			if (builders[id]) {
				return JSON.stringify(ObjectBuilder.parseObject(id));
			}
		},
		
		createPad: function(id, obj, options) {
			var pad = {};

			console.log('Creating pad for ' + id);

			if (builders[id]) {
				obj.append((pad.pad = $(document.createElement('div'))));
				pad.pad.addClass('pad');
				pad.pad.sortable(builders[id].sortableOptions);
				if (options.types) {
					pad.types = options.types;
				}
				if (options.multiple) {
					pad.multiple = options.multiple;
				}
				builders[id].pads.push(pad);

				return pad.pad;
			}
		},
	};
})(jQuery);
