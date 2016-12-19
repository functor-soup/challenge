[![Build Status](https://travis-ci.org/functor-soup/challenge.svg?branch=master)](https://travis-ci.org/functor-soup/challenge)

### General Software Goals

 - Make sure no invalid state enters the core
 - Program correctness is of the highest concern !!!

### Story 1 Requirements

 - Makes sure input xml file is of valid schema
 - Validator is present as general function so as to apply the same elsewhere
 - Returns Left/Right rather than throw errors
 - Input to this validator function are strings rather than filenames, much more easier to test 
 - Make sure the max number of parking spots in each parking lot is obeyed

### Story 1 consideration

 - Use of streams for xml was eschewed in favour of being able to use a schema to validate the file xml input the flexibility
   of the user to be able to change the schema at will. Therefore in this case program input correctness and flexibility
   was prioritized over input read speed and memory concerns. 
   If the app has a web interface and given the current requirements there would be no point in using streams because the
   whole bulk of the data would need to be processed in order to give back any sort of usuable results (relative to the current requirements)

 - At the start of the app, the validation has to be done synchronously however the library used for xml to json is an async call. While it maybe be 
   the case that at every other instance of time after validation of the xml structure and conversion,  that would make sense, at the very start it does not
   make sense.


### Story 2

 - To avoid if and else statements which would otherwise be used to account for cases where elapsed time since the start of the app does not include 
    certain parking times, a modified version of the mathematical `sign` function is used wherein only positive numbers would pass through (this modified
   function does not include the use of if/else statements)

### Story 2 and Story 3

 - The functions responsible for calculations prices and discounts return tuples (non-native t javascript, library exists for that thankfully) so 
   to generalize

 
