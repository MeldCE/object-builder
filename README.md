object-builder
==============

ObjectBuilder allows the construction of a complex Javascript object using
a GUI to put together elements given to the ObjectBuilder. It uses jQuery to
create the GUI used to build the object.

When a ObjectBuilder is created, the elements are placed in the ObjectBuilder
store div separated into different types. A user can then click and drag these
elements onto the pad to add them to the created object. Each element can have
their own pads which more elements can be placed on, creating a hierarchical
object.

The Javascript object is created by going through the elements in the pad.
Drawing and parsing functions can be specified for each element or element
type. If no parsing functions are specified for an element, an object will
created with the element type, element id and element value to represent
that element.

To initiate, simply call `ObjectBuilder.create(div, elements, options)`
- `div`      - The div that the Object Builder will be placed in.
- `elements` - An object containing the elements available. This should the
               parameters as given below.
- `options` - See Options below.

## Elements
The elements object passed to the ObjectBuilder should contain element
types containing elements to be used to build the object.

### Element Types
Each element type should be a unique object within the elements object and
can contain the following properties:
- `label: <string>` - Label to be used for the heading of the element types
  in the store
- `className: <string>` - Class to be put on each element
- `draw: <function>` - Function to be used to draw an element of this type
  when placed in the pad
- `parse: <function>` - Function to be used to parse an element of this type

### Elements
Each element should be a unique object within the element type object and
must contain the following properties:
- `label: <string>` - Label to be used for the heading of the element types
  in the store

Each element can also contain the following properties:
- `value: <value>` - If a draw and parse function is not specified, this
  value will be added to these elements when the object is parsed.
- `className: <string>` - Class to be put on these elements.
- `draw: <function>` - Function to be used to draw these elements
  when placed in the pad.
- `parse: <function>` - Function to be used to parse these elements.

## Options 
The following options are available:
- `input: <jQueryObject>` - Input element to place the parsed object JSON into
  every time the object is updated
- `onchange: <function>` - Function that will be called every time the object
  is updated. It will be passed the ObjectBuilder id as an argument.

## Example
```
<script language="JavaScript" type="text/javascript">
	(function() {
		function drawJoin(obj, id) {
			console.log('Drawing Join');
			
			obj.html('Join ');

			// Add pad
			obj.data({pad: ObjectBuilder.createPad(id, obj, { multiple: true })});
		}

		function parseJoin(type, element, obj, id) {
			var data;
			if (data = obj.data()) {
				return {
					parts: ObjectBuilder.parsePadObject(id, data.pad)
				}
			}
		}

		elements = {
			fields: {
				label: 'Fields',
				className: 'field',
				elements: {
					title: {
						label: 'Title'
					},
					first_name: {
						label: 'First Name',
					},
					last_name: {
						label: 'Last Name',
					},
					email: {
						label: 'Email',
					},
				},
			},
			functions: {
				label: 'Functions',
				className: 'function',
				elements: {
					CONCAT: {
						label: 'Join',
						draw: drawJoin,
						parseObject: parseJoin
					},
				},
			},
		};

		function alertObject(id) {
			alert('The object is now\n' + ObjectBuilder.getObjectJSON(id));
		}

		ObjectBuilder.create(div, elements, { input: input, onchange: alertObject });
	})();
</script>
```
