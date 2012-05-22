object-builder
==============

Javascript to build an object from given elements using a GUI

This is an initial test version that isn't quite complete, but I have uploaded for anyone wondering what this is about. The main object, ObjectBuilder, is defined below.

*Note: This script currently requires JQuery and an additional core.js script to work*

Please send any feedback to github@theweldstudio.com

ObjectBuilder(div, input, elements, initial, full)
   div      - The div that the Object Builder will be placed in
   input    - Input element to place the parsed object
   elements - An object containing the elements available. This should the
               parameters as given below
   initial  - Initial object. Will be used to populate the pad on rebuild
   full     - If set, the possible elements will be always shown

Elements must be structured in the following way
 elements = {
   <elementType>: { 
     label: <label>, // This label will be displayed above the group
                     //  of elements
     className: <class>, // The CSS class to use for this element
     elements: [ // The array containing the elements of this type
       {
         label: <label>, // Will be shown on the element
         value: <value>, // Will be the value in the parsed object
         editable: true | false, // If true, the user will be able to change
                                 //  the value of the element
         objects: [ // Set if the element should be able to have elements
                    //  inside of it
           {
             type: [<elementType>, ...], // A list of the elements that can
                                         //  be placed inside this element
             many: true // Set to allow multiple elements to be placed
                        //  placed inside this element
           },
           ...
         ]
       },
       ...
     ],
     ...
   },
   ...
 }

