import Validation, { EMPTY_MANDATORY_FIELD_ERROR, STOP_OPTION } from '../index.js';

describe('Validation_class', () => {


    // Tests that validate marks empty mandatory fields as invalid. 
    it("test_validate_empty_mandatory_field", async () => {
        // Given
        const model = { fields: {} };
        const fields = [
            {
                name: 'name',
                isOptional: false
            }
        ];
        const data = { name: '' };
        const validation = new Validation(model, fields);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(false);
        expect(model.fields.name).toEqual(EMPTY_MANDATORY_FIELD_ERROR);
    });

    // Tests that validate skips fields with no tests and fields with skipIf condition true. 
    it("test_validate_skipped_fields", async () => {
        // Given
        const model = { fields: {} };
        const fields = [
            {
                name: 'name',
                tests: null
            }, {
                name: 'age',
                skipIf: () => true
            }
        ];
        const data = { name: 'John', age: 25 };
        const validation = new Validation(model, fields);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(true);
    });

    // Tests that validate marks invalid fields with the correct error message. 
    it("test_validate_invalid_fields", async () => {
        // Given
        const model = { fields: {} };
        const fields = [
            {
                name: 'email',
                tests: [
                    {
                        fn: () => false,
                        message: 'Invalid email'
                    }
                ]
            }];
        const data = { email: 'invalid' };
        const validation = new Validation(model, fields);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(false);
        expect(model.fields.email).toEqual('Invalid email');
    });

    // Tests that validation fields evaluation stops on first failure if rule.stopOnFailure === 'fields'. 
    it("test_validate_stop_on_failure", async () => {
        // Given
        const model = {
            fields: {
                age: false,
                name: false
            }
        };
        const fields = [
            {
                name: 'age',
                tests: [
                    {
                        fn: () => false,
                        message: 'Invalid age'
                    }
                ],
                stopOnFailure: STOP_OPTION.FIELDS
            }, {
                name: 'name'
            }
        ];
        const data = {
            age: 17,
            name: 'John'
        };
        const validation = new Validation(model, fields);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(false);
        expect(model.fields.age).toEqual('Invalid age');
        expect(model.fields.name).toBe(false);
    });

    // Tests that a fields rule tests evaluation stops 
    // on first success if rule.stopOnSuccess === 'tests'. 
    it("test_validate_stop_on_success", async () => {
        // Given
        const model = {
            fields: {
                age: false,
                name: false
            }
        };
        const fields = [
            {
                name: 'age',
                tests: [{
                    fn: () => true, message: 'Invalid age'
                }, {
                    fn: () => false //this should be always skipped a s the previous test always succeedes
                }],
                stopOnSuccess: STOP_OPTION.TESTS
            },

            {
                name: 'name'
            }
        ];
        const data = { age: 17, name: 'John' };
        const validation = new Validation(model, fields);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(true);
        expect(model.fields.age).toBe(true);
        expect(model.fields.name).toBe(true);
    });

    // Tests that validate returns true for valid data. 
    it("test_validate_valid_data", async () => {
        console.info(`Test: test_validate_valid_data}`)

        // Given
        const model = { fields: {} };
        const fields = [
            {
                name: 'name',
                tests: [
                    {
                        fn: () => true
                    }
                ]
            }
        ];
        const data = { name: 'John' };
        const validation = new Validation(model, fields);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(true);
    });

    // Tests that validate does not mark optional empty fields as invalid. 
    it("test_validate_optional_fields", async () => {
        // Given
        const model = { fields: {} };
        const fields = [
            {
                name: 'email',
                isOptional: true
            }
        ];
        const data = {};
        const validation = new Validation(model, fields);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(true);
    });

    // Tests that validate uses the custom mandatory name error message when set. 
    it("test_validate_custom_mandatory_error", async () => {
        // Given
        const model = { fields: {} };
        const fields = [
            {
                name: 'name',
                isOptional: false
            }
        ];
        const data = { name: '' };
        const errorMessage = 'This name is required';
        const validation = new Validation(model, fields).withMandatoryFieldError(errorMessage);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(false);
        expect(model.fields.name).toEqual(errorMessage);
    });

    // Tests that validate handles numeric fields correctly.  
    it("test_validate_numeric_fields", async () => {
        // Given
        const model = { fields: {}, isValid: false };
        const fields = [
            {
                name: "age",
                tests: [
                    {
                        fn: (data) => typeof data === "number",
                        message: "Age must be a number"
                    }
                ]
            }
        ];
        const data = { age: 25 };
        const validation = new Validation(model, fields);

        // When
        const result = await validation.validate(data);

        // Then
        expect(result).toBe(true);
        expect(model.isValid).toBe(true);
    });


    // Tests that validate handles deep properties correctly.  
    it("test_validate_deep_properties", async () => {
        // Given
        const model = { fields: {}, isValid: false };
        const fields = [{
            name: "address.post_code",
            tests: [
                {
                    fn: (data) => typeof data === "number",
                    message: "Post Code must be a number"
                }
            ]
        }];
        const data = { address: { post_code: 4890 } };
        const validation = new Validation(model, fields);

        // When
        const result = await validation.validate(data);

        // Then
        expect(result).toBe(true);
        expect(model.isValid).toBe(true);
    });

    it("test_validate_deep_fields", async () => {
        const model = { fields: {}, isValid: false };
        const fields = [
            {
                name: "subs",
                fields: [
                    {
                        name: 'bread',
                        tests: [
                            {
                                fn: val => ['herbs', 'wholemeal'].includes(val),
                                message: 'Bread not available'
                            }
                        ]
                    }
                ]
            }
        ];
        const data = {
            subs: [
                {
                    bread: 'grains'
                },
                {
                    bread: 'grains'
                },
            ]
        }

        const validation = new Validation(model, fields);
        // When
        const result = await validation.validate(data);

        // Then
        expect(result).toBe(false);
        expect(model.isValid).toBe(false);
    });
});
