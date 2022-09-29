import get from 'lodash.get';

const EMPTY_VALUE = [null, undefined, ''];

// RULE SCHEMA ------------------------------------------------------
// {
//     isOptional : Boolean, //not required in rule config
//     field : String, //the field name,
//     tests : [ //not required in rule config
//         { 
//             fn : Function '', //async returning Promise<Boolean>, true for test passed
//             message : String, //failure message template,
//             stopOnFailure : Boolean, // default true, not required in rule config,
//             stopOnSuccess : Boolean, // default false, not required in rule config,
//      }
//     ]
// }
//---------------------------------------------------------------------

const fieldIsEmpty = data => 
    typeof data !== 'number' && (data === false || !data?.length); //this covers required true, null, undefined, '' and empty array


export default class Validation {
    #model = null
    #rules = null
    #mandatoryFieldError = 'This information is required';

    constructor(model, rules) {
        this.#model = model;
        this.#rules = rules;
    }

    withMandatoryFieldError(text) {
        this.#mandatoryFieldError = text;
        return this;
    }

    async validate(data) {
        let valid = true;

        const invalidate = (field, message) => {
            valid = false;
            this.#model.fields[field] = message;
        }

        const mandatoryFieldFault = (name, message) => {
            if (get(data,name) !== true && !get(data,name)?.length) {
                invalidate(name, message || this.#mandatoryFieldError);
            }
        }

        for(let rule of this.#rules) {
            const fieldData = get(data,rule.field);
            const isEmpty = await (rule.emptyTest || fieldIsEmpty)(fieldData)
            if(rule.isOptional && isEmpty) {
                continue; //empty/false but not mandatory. no issue
            }
            if(!rule.isOptional && isEmpty) {
                mandatoryFieldFault(rule.field, rule.emptyFieldMessage); //a non empty value or a true is required
                continue;
            }
            if(!rule.tests) {
                continue;
            }
            for(let test of rule.tests) {
                if(!(await test.fn(get(data,rule.field)))) {
                    invalidate(rule.field, test.message);
                    if(rule.stopOnFailure) {
                        break;
                    }
                } else if(rule.stopOnSuccess) {
                    break;
                }
            }
        }
        return (this.#model.isValid = valid);
    }
}