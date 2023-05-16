const EMPTY_VALUE = [null, undefined, ''];
export const EMPTY_MANDATORY_FIELD_ERROR = 'empty_mandatory_field';
import get from 'lodash.get';

const fieldIsEmpty = data => 
    typeof data !== 'number' && (data === false || !data?.length); //this covers required true, null, undefined, '' and empty array


export default class Validation {
    #model = null
    #rules = null
    #mandatoryFieldError = EMPTY_MANDATORY_FIELD_ERROR;

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
            if(rule.skipIf && rule.skipIf(data, rule.field)) {
                continue;
            }
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
                if(!(await test.fn(get(data,rule.field), rule.field, data))) {
                    invalidate(rule.field, test.message);
                    if(rule.stopOnFailure) {
                        break;
                    }
                    continue;
                } 
                setValid(rule.field);
                if(rule.stopOnSuccess) {
                    break;
                }
            }
        }
        return (this.#model.isValid = valid);
    }
}