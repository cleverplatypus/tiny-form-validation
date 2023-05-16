# Tiny Form Validation

A small utility class to handle validation of an object's properties using rules.

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

const rules = [
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
                fn: (value, fieldName, data) => isValidEmail(value), // isValidEmail is some fancy third party function
                message : `This doesn't look like an email address`
            }
        ]
    }, {
        field : 'address.postal_code',
        tests : [
            {
                fn : (value, fieldName, data) => isValidPostalCode(value, 'AU'), //other fancy external validation function
                message : `Please enter a valid postal code`
            }
        ]
    }, {
        field : 'ip_address',
        skipIf : (data, field) => !data.uses_internet,
        tests : [
            {
                fn : isIP4,
                stopOnSuccess: true
            }, {
                fn : isIP6,
                message : 'Please enter either an IP4 or IP6 address'
            }
        ]
    }
]

const validation = new Validation(model, rules);

const formData = {
    first_name : 'Joe',
    last_name : 'Bro',
    address : {
        postal_code : '234324'
    },
    uses_internet : true,
    ip_address : '102.168.1.1'
}
validation.validate(formData);
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



