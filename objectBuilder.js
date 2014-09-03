var ObjectBuilder = (function() {
	return function(obj, elements, options) {
		var id = (new Date().getTime()).toString(16);
		var builders = {};

		
		var sortableOptions = {};

		function sortableStop(e, ui) {
			// Find the item
			var i;
			var type = ui.item.attr('data-type');
			var element = ui.item.attr('data-element');
			var item = builders[id]['elements'][type]['elements'][element];
			console.log(type);
			console.log(element);
			console.log(item);
			if (!ui.item.attr('data-drawn')) {
				if (item['draw']) {
					var pads = item['draw'](ui.item);
					if (pads) {
						console.log(pads);
						for (i in pads) {
							console.log('making ' + i + 'sortable');
							pads[i].sortable(sortableOptions);
						}
						builders[id]['store'].find('.item').draggable('option', 'connectToSortable', $('.pad'));
						builders[id]['store'].find('.item').attr('data-found', 'found');
						$('.pad').attr('data-found', 'found');
					}
					ui.item.attr('data-drawn', true);
				}
			}
		}

		sortableOptions['stop'] = sortableStop;

		function populateStore(id) {
			if (builders[id]) {
				var e, type, i, item;
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

					for (i in type['elements']) {
						item = type['elements'][i];

						z.append((y = $(document.createElement('div'))));
						y.addClass('item');
						y.attr('data-type', e);
						y.attr('data-element', i);
						y.html((item['label'] ? item['label'] : i));
					}
				}
			}
		}

		builders[id] = {
			'obj': obj,
			'elements': elements,
			'options': options,
		};

		// Create divs
		obj.append((builders[id]['store'] = $(document.createElement('div'))));
		builders[id]['store'].addClass('store')	
		obj.append((builders[id]['pad'] = $(document.createElement('div'))));
		builders[id]['pad'].addClass('pad');
		builders[id]['pad'].sortable(sortableOptions);

		// Populate the store
		populateStore(id);

		builders[id]['store'].find('.item').draggable({
			appendTo: obj,
			helper: 'clone',
			connectToSortable: builders[id]['pad']
		});
	};
})();
