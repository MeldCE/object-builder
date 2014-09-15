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
			var args = a;
			/**
			 * Append the arguments from the function call to the arguments
			 * given when rFunc was called.
			 */
			if (include) {
				args = a.concat(Array.prototype.slice.call(arguments));
			}
			func.apply(context, args);
		};
	}

	function sortableStop(id, event, ui) {
		// Find the item
		var i;
		var type = ui.item.attr('data-type');
		var element = ui.item.attr('data-element');
		var elements = builders[id]['elements'][type];
		var item = elements['elements'][element];
		
		if (!ui.item.attr('data-drawn')) {
			// Find draw function
			var draw = (item['draw'] ? item['draw'] : (elements['draw'] ? elements['draw'] : null));
			if (draw) {
				var pads = draw(ui.item, id);
				if (pads) {
					//console.log(pads);
					for (i in pads) {
						//console.log('making ' + i + 'sortable');
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
		ObjectBuilder.reparse(id);

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
					y.addClass(e + '-' + i);
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

	function createElement(id, obj, type, element, value) {
		var y, item = builders[id].elements[type]['elements'][element];
		var typeData = builders[id].elements[type];

		obj.append((y = $(document.createElement('div'))));
		y.addClass('item');
		y.addClass(type + '-' + element);
		if (part = (item['className'] ? item['className'] : (type['className'] ? type['className'] : false))) {
			y.addClass(part);
		}
		y.attr('data-type', type);
		y.attr('data-element', element);
		
		var draw = (item['draw'] ? item['draw'] : (typeData['draw'] ? typeData['draw'] : null));
		if (value && draw) {
			var pads = draw(y, id, value);
			if (pads) {
				//console.log(pads);
				for (i in pads) {
					//console.log('making ' + i + 'sortable');
					pads[i].sortable(builders[id].sortableOptions);
				}
			}
		} else {
			y.html((item['label'] ? item['label'] : element));
			y.attr('data-value', item['value']);
		}
	}

	function populatePad(id, obj, value) {
		console.log('populatePad running');
		if (value && builders[id]) {
			console.log(value);
			var e;
			for (e in value) {
				if (value[e]._type && value[e]._element
						&& builders[id].elements[value[e]._type]
						&& builders[id].elements[value[e]._type]['elements'][value[e]._element]) {
					createElement(id, obj, value[e]._type, value[e]._element, value[e]);
				}
			}
		}
	}

	function connectPads(id) {
		//console.log('connecting pads');
		if (builders[id]) {
			//console.log('valid builder');
			var i, storeTypes = {all: $()}, specificStoreTypes = {};
			
			for (i in builders[id].pads) {
				//console.log('Checking pad');
				//console.log(builders[id].pads[i]);
				// Check if is full
				var max = (builders[id].pads[i].multiple ? builders[id].pads[i].multiple : 1);
				//console.log('Pad has a limit of ' + max);
				if (max !== true) {
					//console.log('Currently has ' + builders[id].pads[i].pad.children('.item').length);
					if (builders[id].pads[i].pad.children('.item').length >= max) {
						//console.log('Pad is full');
						continue;
					}
				}
				if (!builders[id].pads[i].types) {
					//console.log('Adding pad to all');
					storeTypes.all = storeTypes.all.add(builders[id].pads[i].pad);
				} else {
					//console.log('Have specific types: ' + builders[id].pads[i].types);
					var t;
					if (typeof(builders[id].pads[i].types) == 'string') {
						builders[id].pads[i].types = [builders[id].pads[i].types];
					}
					for (t in builders[id].pads[i].types) {
						var type = builders[id].pads[i].types[t];
						if (type.indexOf('-') !== -1) {
							//console.log('Have specific item: ' + type);
							type = type.split('-');
							if (builders[id].stores[type[0]]) {
								//console.log('Found for ' + type[0]);
								if (!specificStoreTypes[type[0]]) {
									specificStoreTypes[type[0]] = {};
								}
								if (!specificStoreTypes[type[0]][type[1]]) {
									specificStoreTypes[type[0]][type[1]] = $();
								}
								specificStoreTypes[type[0]][type[1]] = specificStoreTypes[type[0]][type[1]].add(builders[id].pads[i].pad);
							}
						} else {
							if (builders[id].stores[type]) {
								if (!storeTypes[type]) {
									storeTypes[type] = $();
								}
								storeTypes[type] = storeTypes[type].add(builders[id].pads[i].pad);
							}
						}
					}
				}
			}

			for (t in builders[id].stores) {
				//console.log('connecting store ' + i);
				// Add pads that accept all to the specific pads
				if (!storeTypes[t]) {
					//console.log('no specifics, adding all');
					storeTypes[t] = storeTypes.all;
				} else {
					//console.log('appending all');
					storeTypes[t] = storeTypes[t].add(storeTypes.all);
				}

				builders[id].stores[t].find('.item').draggable('option', 'connectToSortable', storeTypes[t]);

				if (specificStoreTypes[t]) {
					//console.log('Have specifics for type ' + t);
					for (i in specificStoreTypes[t]) {
						//console.log('Have specific item ' + i + ' ' + '[data-element=' + i + ']');
						var specifics = storeTypes[t].add(specificStoreTypes[t][i]);
						builders[id].stores[t].find('[data-element="' + i + '"]').draggable('option', 'connectToSortable', specifics)
					}
				}
			}
		}
	}
	
	return {
		create: function(obj, elements, options, value) {
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

			if (value) {
				try {
					value = JSON.parse(value);
				} catch(e) {
					value = null;
				}
			}

			// Create divs
			obj.append((builders[id]['store'] = $(document.createElement('div'))));
			builders[id]['store'].addClass('store');

			// Populate the store
			populateStore(id);

			builders[id]['pad'] = this.createPad(id, obj, builders[id].options, value);

			// Make the items in the store draggable
			builders[id]['store'].find('.item').draggable({
				appendTo: obj,
				helper: 'clone',
			});

			// Populate the pad
			//populatePad(id, builders[id]['pad'], value);

			// Connect pads
			connectPads(id);

			// Update value
			if (value && builders[id].input) {
				ObjectBuilder.reparse(id);
			}

			return id;
		},
	
		reparse: function(id) {
			if (builders[id] && builders[id].input) {
				builders[id].input.val(ObjectBuilder.getObjectJSON(id));
			}
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
						var parse; 
						if (parse = (elements[type].elements[element].parse ? elements[type].elements[element].parse : (elements[type].parse ? elements[type].parse : null))) {
							var parsed = parse($(this), id);
							// Add type and element to object
							parsed['_type'] = type;
							parsed['_element'] = element
							obj.push(parsed);
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
		
		createPad: function(id, obj, options, value) {
			var pad = {};

			//console.log('Creating pad for ' + id);

			if (builders[id]) {
				obj.append((pad.pad = $(document.createElement('div'))));
				pad.pad.addClass('pad');
				pad.pad.sortable(builders[id].sortableOptions);
				if (options && options.types) {
					pad.types = options.types;
				}
				if (options && options.multiple) {
					pad.multiple = options.multiple;
				}
				builders[id].pads.push(pad);
				
				if (value) {
					populatePad(id, pad.pad, value);
				}

				return pad.pad;
			}
		},
	};
})(jQuery);
