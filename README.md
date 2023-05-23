# Tiny Form Validation

A small utility class to handle validation of an object's properties using field rules.

## Installation

```
yarn add git+https://github.com/cleverplatypus/tiny-form-validation.git
```

or

```
npm i git+https://github.com/cleverplatypus/tiny-form-validation.git
```

## Usage

```javascript
const model = {
    fields : {
        first_name : false,
        last_name : false,
        favourite_colour : false,
        email : false
        'address.postal_code' : false,
        uses_internet : false,
        ip_address : false
    },
    isValid : false
};

const fields = [
    {
        field : 'first_name'
    }, {
        field : 'last_name'
    }, {
        field : 'favourite_colour',
        isOptional : true
    }, {
        field : 'email',
        emptyFieldMessage : 'You need to enter your email address',
        tests : [
            {
                fn: (value, {field, data}) => isValidEmail(value), // isValidEmail is some fancy third party function
                message : `This doesn't look like an email address`
            }
        ]
    }, {
        field : 'address.postal_code',
        tests : [
            {
                fn : (value, {field, data, getCurrentCountryCode}) => isValidPostalCode(value, getCurrentCountryCode()), //other fancy external validation function
                message : `Please enter a valid postal code`
            }
        ]
    }, {
        field : 'ip_address',
        skipIf : ({data, field}) => !data.uses_internet,
        tests : [
            {
                fn : isIP4,
                stopOnSuccess: true
            }, {
                fn : isIP6,
                message : 'Please enter either an IP4 or IP6 address'
            }
        ]
    }, {
        fields : ''
    }
]
const context = {
    async getCurrentCountryCode() {
        return 'FR';
    }
}
const validation = new Validation(model, fields);

const formData = {
    first_name : 'Joe',
    last_name : 'Bro',
    address : {
        postal_code : '234324'
    },
    uses_internet : true,
    ip_address : '102.168.1.1'
}
validation.validate(formData, context);
```

### `model`
The model parameter passed to the `Validation` constructor is the object that will contain validation results.

In its basic form it's only required to contain a `fields` property of type `Object`, however, when using reactive objects such as in VueJS, it's good practice to define all the `model`'s properties as the UI might not be able to detect new properties.

The object will also contain a root boolean `isValid` field reflecting the overall validation outcome.

The value for each `fields` entry will be:
- `false` if the field wasn't validated
- `true` if the field passed validation
- a string with the validation failure description

NOTE: deep fields can be declared using dot notation.

## The context object
An optional `Object` can be passed to the `validate` method to allow passing of additional data and/or functions to be used by the `rule.tests.fn` and `rule.skipIf` functions.
The context object will be merged with `{field : String, data : Object}` before being passed to these functions.

## API


### Constructor
```js
const validator = new Validation(model, fields);
```

### `validate(data, context)`
The validate method accepts two parameters
- **data:** an `Object` with the data to validate
- **context:** an optional context `Object` 

### `rule.tests[].fn(value, context)`
Each test object must provide an `async fn` function that receives the current field's value to test plus the context object and returns a `Boolean` or a `Promise<Boolean>`. A `true` value signifies a passed test.

### `rule.tests[].stopOnSuccess, rule.tests[].stopOnFailure`
Determines whether the workflow should stop after a test failure/success. The value, if specified, must be either:
- `'tests'`: will skip the following tests, if any
- `'fields'`: will stop evaluating the current rule

The library exports a `STOP_OPTION` object enumerating `TESTS` and `FIELDS` constants for this purpose.




