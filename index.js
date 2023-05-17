const EMPTY_VALUE = [null, undefined, ''];
export const EMPTY_MANDATORY_FIELD_ERROR = 'empty_mandatory_field';
export const STOP_OPTION = Object.freeze({
    RULES : 'rules',
    TESTS : 'tests'
})
import get from 'lodash.get';

const fieldIsEmpty = data => 
    typeof data !== 'number' && (data === false || !data?.length); //this covers required true, null, undefined, '' and empty array

function validateRules(rules) {
    for(const rule of rules)     {
        if(rule.stopOnFailure && !['tests', 'rules'].includes(rule.stopOnFailure)) {
            throw new Error(`rule.stopOnFailure's value, if specified must be either 'tests' or 'rules'. Please use the exported STOP_OPTION.TESTS or STOP_OPTION.RULES for consistency`)
        }
        if(rule.stopOnSuccess && !['tests', 'rules'].includes(rule.stopOnSuccess)) {
            throw new Error(`rule.stopOnSuccess's value, if specified must be either 'tests' or 'rules'. Please use the exported STOP_OPTION.TESTS or STOP_OPTION.RULES for consistency`)
        }
        if(!rule.field) {
            throw new Error('rule.field must be specified');
        }
    }
    return rules;
}

export default class Validation {
    #model = null
    #rules = null
    #mandatoryFieldError = EMPTY_MANDATORY_FIELD_ERROR;

    constructor(model, rules) {
        this.#model = model;
        this.#rules = validateRules(rules);
    }

    withMandatoryFieldError(text) {
        this.#mandatoryFieldError = text;
        return this;
    }

    async validate(data, context = null) {
        let valid = true;

        const invalidate = (field, message) => {
            valid = false;
            this.#model.fields[field] = message;
        }

        const setValid = (field) => {
            this.#model.fields[field] = true;
        }

        const mandatoryFieldFault = (name, message) => {
            if (get(data, name) !== true && !get(data,name)?.length) {
                invalidate(name, message || this.#mandatoryFieldError);
            }
        }

        for(let rule of this.#rules) {
            const fieldData = get(data, rule.field);
            const isEmpty = await (rule.emptyTest || fieldIsEmpty)(fieldData)
            const aContext = Object.freeze(Object.assign({
                field : rule.field, 
                data
            }, context));

            if(rule.skipIf && rule.skipIf(aContext)) {
                continue;
            }
            if(rule.isOptional && isEmpty) {
                continue; //empty/false but not mandatory. no issue
            }
            if(!rule.isOptional && isEmpty) {
                mandatoryFieldFault(rule.field, rule.emptyFieldMessage); //a non empty value or a true is required
                continue;
            }
            //first set the field valid. This will be overridden on test failure
            setValid(rule.field);

            if(!rule.tests) {
                continue;
            }
            let stopRules = false;

            for(let test of rule.tests) {
                
                if(!(await test.fn(get(data,rule.field), aContext))) {
                    invalidate(rule.field, test.message);
                    if(rule.stopOnFailure) {
                        if(rule.stopOnFailure === 'rules') {
                            stopRules = true;
                        }
                        break;
                    }
                    continue;
                } 
                if(rule.stopOnSuccess) {
                    if(rule.stopOnSuccess === 'rules') {
                        stopRules = true;
                    }
                    break;
                }
            }
            if(stopRules) {
                break;
            }
        }
        return (this.#model.isValid = valid);
    }
}