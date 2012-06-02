// Object Builder
//
// Create Javascript objects from elements.
//
// Created By: The Weld Studio (http://www.theweldstudio.com)
// Created: 22 May 2012
//
// Version: 0.6
// Last Updated: 2 June 2012
//
//
// This work is licenced under a Creative Commons 
//  Attribution-NonCommercial-ShareAlike 3.0 Unported License.
// The licence can be viewed at
//  http://creativecommons.org/licenses/by-nc-sa/3.0/
// You are free:
//   to Share - to copy, distribute and transmit the work
//   to Remix - to adapt the work
//
// Under the following conditions:
//   Attribution - You must attribute the work in the manner specified by the
//    author or licensor (but not in any way that suggests that they endorse
//    you or your use of the work).
//   Noncommercial - You may not use this work for commercial purposes.
//   Share Alike - If you alter, transform, or build upon this work, you may
//    distribute the resulting work only under the same or similar license to
//    this one.
//
// With the understanding that:
//   Waiver - Any of the above conditions can be waived if you get permission
//    from the copyright holder.
//   Public Domain - Where the work or any of its elements is in the public
//    domain under applicable law, that status is in no way affected by
//    the license.
//   Other Rights - In no way are any of the following rights affected
//    by the license:
// 
// Your fair dealing or fair use rights, or other applicable copyright
//  exceptions and limitations;
//   The author's moral rights;
//   Rights other persons may have either in the work itself or in how
//     the work is used, such as publicity or privacy rights.
// 
// Notice - For any reuse or distribution, you must make clear to others the
//  license terms of this work. The best way to do this is with a link to
//  this web page.
//
//
// Copyright The Weld Studio Ltd 2012


// ObjectBuilder(div, input, elements, initial, full)
//   div      - The div that the Object Builder will be placed in
//   input    - Input element to place the parsed object
//   config   - An object containing the elements available. This should the
//               parameters as given below
//   initial  - Initial object. Will be used to populate the pad on rebuild
//   full     - If set, the possible elements will be always shown
//
// config must be structured in the following way
// config = {
//   type: [<elementType>, ...], // A list of the elements that can be placed
//                               // inside the base element
//   elements: {
//     <elementType>: { 
//       label: <label>, // This label will be displayed above the group
//                       //  of elements. This can contain % TODO
//       className: <class>, // The CSS class to use for this element
//       elements: [ // The array containing the elements of this type
//         {
//           label: <label>, // Will be shown on the element
//           value: <value>, // Will be the value in the parsed object
//           editable: true | false, // If true, the user will be able to change
//                                   //  the value of the element
//           builder: <functionRef>, // Function to be called to generate the
//                                   // the contents of the element. The
//                                   // function should the following arguments.
//                                   //  <obj> - the element DOM object
//                                   //  <el>  - this element object
//           objects: [ // Set if the element should be able to have elements
//                      //  inside of it
//             {
//               type: [<elementType>, ...], // A list of the elements that can
//                                           //  be placed inside this element
//               many: true // Set to allow multiple elements to be placed
//                          //  placed inside this element
//             },
//             ...
//           ]
//         },
//         ...
//       ],
//       ...
//     },
//     ...
//   }
// }
//
function ObjectBuilder(div, input, config, initial, full) {
	this.div = div;
	this.input = input;
	if (full) {
		this.full = true;
	}

	// TODO Add proper test
	if (div) {
		this._create();

		if (config) {
			if (!initial) {
				initial = false;
			}
			this.rebuild(config, initial);
		}
	}
}

ObjectBuilder.prototype = {
	_create: function() {
		div.appendChild(this.pad = document.createElement('div'));
		this.pad.className = 'pad';
		this.pad.innerHTML = '';

		this.store = document.createElement('div');
		this.store.className = 'store';
		if (!this.full) {
			this.store.style.display = 'none';
			
			document.body.addEventListener('click', this);
		}
		div.appendChild(this.store);
	},

	showHide: function(element) {
		if (element.eStore.style.display == 'none') {
			element.eStore.style.display = '';
			showHide.innerHTML = 'Hide';
		} else {
			showHide.innerHTML = 'Show';
			element.eStore.style.display = 'none';
		}
	},

	rebuild: function(config, value) {
		try {
			this.config = config;

			// Delete any current objects
			this.pad.innerHTML = '';
			this.store.innerHTML = '';

			if (config.type) {
				this.pad.setAttribute('data-limit-types', config.type);
			}

			var e;
			var elements = config.elements;
			for (e in elements) {
				var className = false;
				if (elements[e].className) {
					className = elements[e].className;
				}
				if (elements[e].label) {
					this.store.appendChild(elements[e].title = document.createElement('div'));
					elements[e].title.innerHTML = elements[e].label;
					elements[e].title.className = 'title';
				}

				if (elements[e].elements) {
					var items = elements[e].elements;
					this.store.appendChild(eStore = document.createElement('div'));
					eStore.className = 'elementStore';
					elements[e].eStore = eStore;
					var i;
					for (i in items) {
						var item;
						
						eStore.appendChild(item = this._createItem(className));
						items[i].item = item;
						item.setAttribute('data-type', e);

						if (items[i].value) {
							item.setAttribute('data-value', items[i].value);
						}
						if (items[i].editable) {
							item.setAttribute('data-editable', 1);
						}
						if (items[i].builder) {
							items[i].builder(item, items[i]);
						} else {
							if (items[i].objects) {
								item.setAttribute('data-has-objects', 1);
								
								var label = items[i].label;
								var positions = [];
								var found = {};
								var divs = { null: [] };
								var x;
								var leftoverSpace = false;
								var objects = items[i].objects;
		
								for (o in objects) {
									// Create object
									var object = this._createItem('object');
									object.innerHTML = '';
									object.setAttribute('data-has-objects', 1);

									if (objects[o].type) {
										object.setAttribute('data-limit-types', objects[o].type);
									}

									if (objects[o].many) {
										object.setAttribute('data-many', 1);
									}
									
									if((x = label.indexOf('%{' + o + '}')) != -1) {
										positions.push(x);
										found[x] = o;
										divs[x] = {name: o, object: object};
									} else {
										divs[null].push(object);
									}
								}

								if((x = label.indexOf('%{}')) != -1) {
									leftoverSpace = true;
									positions.push(x);
									divs[x] = {name: ''};
								}

								positions.sort(function(a,b){return a-b});
								var p;
								for (p in positions) {
									label = label.split('%{' + divs[positions[p]]['name'] + '}');
								
									item.appendChild(labelDiv = document.createElement('div'));
									labelDiv.className = 'label';
									labelDiv.innerHTML = label[0];
									if (label.length > 2) {
										label.shift();
										label = label.join('%{' + divs[positions[p]]['name'] + '}');
									} else {
										label = label[1];
									}
									
									if (!divs[positions[p]]['object']) {
										for (o in divs[null]) {
											item.appendChild(divs[null][o]);
										}
									} else {
										item.appendChild(divs[positions[p]]['object']);
									}
								}

								if (label) {
									item.appendChild(labelDiv = document.createElement('div'));
									labelDiv.className = 'label';
									labelDiv.innerHTML = label;
								}
		
								if (!leftoverSpace && divs[null].length) {
									item.appendChild(label = document.createElement('div'));
									label.className = 'label';
									label.innerHTML = '(';
									
									for (o in divs[null]) {
										item.appendChild(divs[null][o]);
									}
									
									item.appendChild(label = document.createElement('div'));
									label.className = 'label';
									label.innerHTML = ')';

								}
							} else if (items[i].label) {
								item.appendChild(label = document.createElement('div'));
								label.className = 'label';
								label.innerHTML = items[i].label;
							}
						}
					}
				}
				
				if (elements[e].label) {
					var _this = this;

					elements[e].title.appendChild(showHide = document.createElement('a'));
					showHide.innerHTML = '';
					showHide.style.marginLeft = '10px';
					showHide.onclick = (function(a) { return function() { _this.showHide(a); }})(elements[e]);
					if (elements[e].hide) {
						elements[e].eStore.style.display = 'none'
						showHide.innerHTML = 'Show';
					} else {
						showHide.innerHTML = 'Hide';
					}
				}
			}

			this.current = [];

			if (value) {
				this._rebuildPad();
			}
		} catch(e) {
		
		}
	},

	_rebuildPad: function(value) {
		try {
			value = unserialize(value);


		} catch(e) {
		}
	},

	_createItem: function (className) {
		var div = document.createElement('div');
		div.setAttribute('data-builder', 1);
		div.className = 'element';
		if (className) {
		 div.className += ' ' + className;
		}
		
		div.addEventListener('mousedown', this, true);

		return div;
	},

	changeValue: function (obj) {
		var value = prompt("Please choose a value", obj.getAttribute('data-value'));
		obj.setAttribute('data-value' , value);
		// TODO
		obj.innerHTML = '<div class="label">' + value + '</div>';
	},

	deleteItem: function(obj) {
		obj.parentNode.removeChild(obj);
	},

	_parse: function () {
		return this._parseRecurse(this.pad)
	},

	_parseRecurse: function (current) {
		var n = current.childNodes, i;
		var nodes = []

		for (i = 0; i < n.length; i++) {
			if (n[i].hasAttribute('data-builder')) {
				var node = {};
				if (n[i].hasAttribute('data-type')) {

					node.type = n[i].getAttribute('data-type');
					if (n[i].hasAttribute('data-value')) {
						node.value = n[i].getAttribute('data-value');
					}
					if (n[i].hasAttribute('data-has-objects')) {
						node.children = this._parseRecurse(n[i]);
					}
				} else {
					if (n[i].hasAttribute('data-has-objects')) {
						node = this._parseRecurse(n[i]);
					}
				}
				nodes.push(node);
			}
		}

		return nodes;
	},

	_findProposal: function () {
		if (!this.drag || !Mouse.isOver(this.pad)) {
			return false;
		}

		var proposed = this._findPropRecurse(this.pad);

		if (!proposed) {
			return false;
		}

		return proposed;
	},

	_findPropRecurse: function (proposed) {
		var n = proposed.childNodes, i;
		var before = false;
		var current = false;
		var validProposal = true;
		var x = 0;

		if (proposed.hasAttribute('data-limit-types')) {
			var types = proposed.getAttribute('data-limit-types').split(',');
			if (types.indexOf(this.drag.getAttribute('data-type')) == -1 || types.indexOf(this.drag.getAttribute('data-type') + '!' + this.drag.getAttribute('data-value')) != -1) {
				validProposal = false;
			}
		}

		// Go through objects elements finding all positions
		for (i = 0; i < n.length; i++) {
			if (this.proposed && n[i] == this.proposed) {
				current = true;
				continue;
			}
	
			if (n[i].hasAttribute('data-builder')) {
				if (n[i].hasAttribute('data-has-objects')) {
					var fine = true;
					if (n[i].hasAttribute('data-limit-types')) {
						var types = n[i].getAttribute('data-limit-types').split(',');
						if (types.indexOf(this.drag.getAttribute('data-type')) == -1 || types.indexOf(this.drag.getAttribute('data-type') + '!' + this.drag.getAttribute('data-value')) != -1) {
							fine = false;
						}
					}

					// FIXME having this set to just inside means that it doesn't play nice when one object is removed. Need to fix.
					if (fine && Mouse.isInXRange(n[i])) {
						var newPropose = this._findPropRecurse(n[i]);
						if (newPropose) {
							return newPropose;
						} else {
							x = $(n[i]).offset().left + (n[i].clientWidth / 2);
						}
					} else {
						x = $(n[i]).offset().left;
					}
				} else {
					x = $(n[i]).offset().left + (n[i].clientWidth / 2);
				}

				if (!proposed.hasAttribute('data-value') && !proposed.hasAttribute('data-many')) {
					return false;
				}

				if (Mouse.before(x, null)) {
					if (current) {
						return true;
					}

					before = n[i];
					break;
				}
			}

			current = false;
		}

		if (validProposal && !proposed.hasAttribute('data-value')) {
			if (current) {
				return true;
			} else {
				return { proposed: proposed, before: before};
			}
		}

		return false;
	},

	alertObject: function() {
		alert(serialize(this._parse()));
	},

	handleEvent: function(evt) {
		if (evt.type == 'click' && evt.button == 0) {
			if (this.store.style.display == 'none') {
				if (Mouse.isOver(this.pad)) {
					this.store.style.display = '';
				}
			} else {
				if (!Mouse.isOver(this.pad) && !Mouse.isOver(this.store)) {
					this.store.style.display = 'none';
				}
			}
		}
		if (evt.type == 'mousedown' && evt.button == 0) {
			evt.preventDefault();
			evt.stopPropagation();
			if (inArray(evt.currentTarget, this.current)) {
				this.proposed = evt.currentTarget;
				this.proposed.style.opacity = '0.6';
			}
			this.drag = evt.currentTarget.cloneNode(true);
			this.drag.style.position = 'absolute';
			this.drag.style.zIndex = 200;
			this.drag.style.opacity = 0.6;
			document.body.addEventListener('mousemove', this, true);
			document.body.addEventListener('mouseup', this, true);
			this.offset = $(evt.currentTarget).offset();
			document.body.appendChild(this.drag);
			this.drag.style.top = Math.round(this.offset.top) + 'px';
			this.drag.style.left = Math.round(this.offset.left) + 'px';
			this.offset.left = evt.clientX + document.body.scrollLeft - this.offset.left;
			this.offset.top = evt.clientY + document.body.scrollTop - this.offset.top;
		}
		if (this.drag) {
			if (evt.type == 'mousemove') {
				//evt.preventDefault();
				//evt.stopPropagation();
				var newx = Math.round(evt.clientX + document.body.scrollLeft - this.offset.left);
				var newy = Math.round(evt.clientY + document.body.scrollTop - this.offset.top);
				this.drag.style.top = newy + 'px';
				this.drag.style.left = newx + 'px';
				
				var obj = this._findProposal();

				if (!obj) {
					// TODO Can we remove?
					if (Mouse.isOver(this.pad)) {
						this.drag.style.backgroundColor = '#fcc';
						this.proposeRemove = true;
					} else {
						this.drag.style.backgroundColor = '';
					}
					if (this.proposed) {
						this.proposed.style.display = 'none';
						this.proposeRemove = true;
						this.drag.style.backgroundColor = '#fcc';
					}
				} else {
					if (this.proposed && this.proposeRemove) {
						this.proposed.style.display = '';
						this.drag.style.backgroundColor = '';
						this.proposed.style.backgroundColor = '';
						this.proposeRemove = false;
					}
					if (obj === true) {
					} else {
						if (!this.proposed) {
							this.proposed = this.drag.cloneNode(true);
							this.proposed.style.position = 'relative';
							this.proposed.style.top = 0;
							this.proposed.style.left = 0;
							this.proposed.style.zindex = 'auto';
						} else {
							this.proposed.parentNode.removeChild(this.proposed);
						}

						if (obj.before) {
							obj.proposed.insertBefore(this.proposed, obj.before);
						} else {
							obj.proposed.appendChild(this.proposed);
						}
					}
				}
			} else if (evt.type == 'mouseup' && evt.button == 0) {
				//evt.preventDefault();
				//evt.stopPropagation();
				if (this.proposed) {
					if (this.proposed.style.display == 'none') {
						this.proposed.parentNode.removeChild(this.proposed);
						if (inArray(evt.currentTarget, this.current)) {
							deleteElement(this.current, evt.currentTarget);
						}
					} else {
						this.proposed.style.opacity = '';
						var _this = this
						if (!inArray(evt.currentTarget, this.current)) {
							this.current.push(this.proposed);
						}
						//this.proposed.addEventListener('mousedown', this);
						if(this.proposed.hasAttribute('data-editable')) {
							this.proposed.onclick = function(evt) {
								_this.changeValue(this);
								evt.preventDefault();
								evt.stopPropagation();
							};
						}
						this.proposed.ondblclick = function(evt) {
							_this.deleteItem(this);
							evt.preventDefault();
							evt.stopPropagation();
						};
					}
					delete(this.proposed);
				}
				if (this.proposeRemove) {
					delete(this.proposeRemove);
				}
				document.body.removeChild(this.drag);
				delete(this.drag);
				document.body.removeEventListener('mousemove', this, true);
				document.body.removeEventListener('mouseup', this, true);
				if (this.input) {
					this.input.value = serialize(this._parse());
				}
			}
			window.getSelection().removeAllRanges()
		}

		return false;
	},
}
