import Validation, { EMPTY_MANDATORY_FIELD_ERROR } from '../index.js';

describe('Validation_class', () => {


    // Tests that validate marks empty mandatory fields as invalid. 
    it("test_validate_empty_mandatory_field", async () => {
        // Given
        const model = { fields: {} };
        const rules = [{ field: 'name', isOptional: false }];
        const data = { name: '' };
        const validation = new Validation(model, rules);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(false);
        expect(model.fields.name).toEqual(EMPTY_MANDATORY_FIELD_ERROR);
    });

    // Tests that validate skips rules with no tests and rules with skipIf condition true. 
    it("test_validate_skipped_rules", async () => {
        // Given
        const model = { fields: {} };
        const rules = [{ field: 'name', tests: null }, { field: 'age', skipIf: () => true }];
        const data = { name: 'John', age: 25 };
        const validation = new Validation(model, rules);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(true);
    });

    // Tests that validate marks invalid fields with the correct error message. 
    it("test_validate_invalid_fields", async () => {
        // Given
        const model = { fields: {} };
        const rules = [{ field: 'email', tests: [{ fn: () => false, message: 'Invalid email' }] }];
        const data = { email: 'invalid' };
        const validation = new Validation(model, rules);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(false);
        expect(model.fields.email).toEqual('Invalid email');
    });

    // Tests that validate stops on first failure if rule.stopOnFailure is true. 
    it("test_validate_stop_on_failure", async () => {
        // Given
        const model = { fields: {} };
        const rules = [{ field: 'age', tests: [{ fn: () => false, message: 'Invalid age' }], stopOnFailure: true }, { field: 'name' }];
        const data = { age: 17, name: 'John' };
        const validation = new Validation(model, rules);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(false);
        expect(model.fields.age).toEqual('Invalid age');
        expect(model.fields.name).toBeUndefined();
    });

    // Tests that validate stops on first success if rule.stopOnSuccess is true. 
    it("test_validate_stop_on_success", async () => {
        // Given
        const model = { fields: {} };
        const rules = [{ field: 'age', tests: [{ fn: () => true, message: 'Invalid age' }], stopOnSuccess: true }, { field: 'name' }];
        const data = { age: 17, name: 'John' };
        const validation = new Validation(model, rules);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(true);
        expect(model.fields.age).toBe(true);
        expect(model.fields.name).toBeUndefined();
    });

    // Tests that validate returns true for valid data. 
    it("test_validate_valid_data", async () => {
        // Given
        const model = { fields: {} };
        const rules = [{ field: 'name', tests: [{ fn: () => true }] }];
        const data = { name: 'John' };
        const validation = new Validation(model, rules);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(true);
    });

    // Tests that validate does not mark optional empty fields as invalid. 
    it("test_validate_optional_fields", async () => {
        // Given
        const model = { fields: {} };
        const rules = [{ field: 'email', isOptional: true }];
        const data = {};
        const validation = new Validation(model, rules);

        // When
        await validation.validate(data);

        // Then
        expect(model.isValid).toBe(true);
    });

    // Tests that validate uses the custom mandatory field error message when set. 
    it("test_validate_custom_mandatory_error", async () => {
        // Given
        const model = { fields: {} };
        const rules = [{ field: 'name', isOptional: false }];
        const data = { name: '' };
        const errorMessage = 'This field is required';
        const validation = new Validation(model, rules).withMandatoryFieldError(errorMessage);

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
        const rules = [{ field: "age", tests: [{ fn: (data) => typeof data === "number", message: "Age must be a number" }] }];
        const data = { age: 25 };
        const validation = new Validation(model, rules);

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
        const rules = [{
            field: "address.post_code",
            tests: [
                {
                    fn: (data) => typeof data === "number",
                    message: "Post Code must be a number"
                }]
        }];
        const data = { address: { post_code: 4890 } };
        const validation = new Validation(model, rules);

        // When
        const result = await validation.validate(data);

        // Then
        expect(result).toBe(true);
        expect(model.isValid).toBe(true);
    });
});
