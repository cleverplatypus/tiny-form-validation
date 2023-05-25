const EMPTY_VALUE = [null, undefined, ''];
export const EMPTY_MANDATORY_FIELD_ERROR = 'empty_mandatory_field';
export const STOP_OPTION = Object.freeze({
    FIELDS: 'fields',
    TESTS: 'tests'
})
import get from 'lodash.get';
import set from 'lodash.set';

const fieldIsEmpty = data =>
    typeof data !== 'number' && (data === false || !data?.length); //this covers required true, null, undefined, '' and empty array

function validateFields(fields) {
    for (const field of fields) {
        if (field.stopOnFailure && !['tests', 'fields'].includes(field.stopOnFailure)) {
            throw new Error(`field.stopOnFailure's value, if specified must be either 'tests' or 'fields'. Please use the exported STOP_OPTION.TESTS or STOP_OPTION.FIELDS for consistency`)
        }
        if (field.stopOnSuccess && !['tests', 'fields'].includes(field.stopOnSuccess)) {
            throw new Error(`field.stopOnSuccess's value, if specified must be either 'tests' or 'fields'. Please use the exported STOP_OPTION.TESTS or STOP_OPTION.FIELDS for consistency`)
        }
        if (!field.name) {
            throw new Error('field.name must be specified');
        }
    }
    return fields;
}

async function evaluateFields({ fields, context, out, data, base = '' }) {
    let valid = true;

    const invalidate = (name, message) => {
        valid = false;
        set(out, name, message);
    }

    const setValid = (name) => {
        set(out, name, true);
    }

    const mandatoryFieldFault = (name, message) => {
        invalidate(name, message || this.mandatoryFieldError);
    }


    for (let field of fields) {
        const fieldData = get(data, field.name);
        const isEmpty = await (field.emptyTest || fieldIsEmpty)(fieldData)
        const aContext = Object.freeze(Object.assign({
            name: field.name,
            data
        }, context));

        if (field.skipIf && field.skipIf(aContext)) {
            continue;
        }
        if (field.isOptional && isEmpty) {
            continue; //empty/false but not mandatory. no issue
        }
        const path = base.split('.').concat(field.name.split('.'), '').filter(seg => !!seg).join('.');

        if (!field.isOptional && isEmpty) {
            mandatoryFieldFault(path, field.emptyFieldMessage);
            continue;
        }
        //first set the name valid. This will be overridden on test failure
        setValid(path);

        //check for subfields
        if (Array.isArray(get(data, field.name)) && field.fields) {
            let idx = 0;
            for (const subData of get(data, field.name)) {
                valid = await evaluateFields.call(this, {
                    fields: field.fields,
                    data: subData,
                    out,
                    context,
                    base: `${path}.${idx}`
                }) && valid;
                idx++;
            }

        }

        if (!field.tests) {
            continue;
        }

        let stopFields = false;

        for (let test of field.tests) {
            if (!(await test.fn(fieldData, aContext))) {
                invalidate(path, test.message);
                if (field.stopOnFailure) {
                    if (field.stopOnFailure === 'fields') {
                        stopFields = true;
                    }
                    break;
                }
                continue;
            }
            if (field.stopOnSuccess) {
                if (field.stopOnSuccess === 'fields') {
                    stopFields = true;
                }
                break;
            }
        }
        if (stopFields) {
            break;
        }
    }
    return valid;
}

export default class Validation {
    #model = null
    #fields = null
    mandatoryFieldError = EMPTY_MANDATORY_FIELD_ERROR;

    constructor(model, fields) {
        this.#model = model;
        this.#fields = validateFields(fields);
    }

    withMandatoryFieldError(text) {
        this.mandatoryFieldError = text;
        return this;
    }

    async validate(data, context = {}) {
        const out = Object.assign({}, this.#model.fields);
        const valid = await evaluateFields.call(this, {
            data,
            fields: this.#fields,
            out,
            context
        });

        Object.assign(this.#model.fields, out);
        return (this.#model.isValid = valid);
    }
}