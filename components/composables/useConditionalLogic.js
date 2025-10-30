// composables/useConditionalLogic.js
import { computed, watch } from 'vue';

export function useConditionalLogic(field, formData, allFields) {
	/**
	 * Get the actual field value considering sub-fields for complex fields
	 * @param {String} fieldId - The field ID (can include sub-field like "5.3" for Name first)
	 * @returns {*} - The field value
	 */
	const getFieldValue = (fieldId) => {
		// Check if this is a sub-field reference (e.g., "5.3" for Name first)
		const fieldIdParts = String(fieldId).split('.');
		const mainFieldId = fieldIdParts[0];
		const subFieldId = fieldIdParts[1];

		const fieldKey = `input_${mainFieldId}`;
		const fieldValue = formData.value?.[fieldKey];

		// If there's a sub-field ID, extract that specific sub-field value
		if (subFieldId && typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue)) {
			const targetField = allFields.value?.find(f => f.id == mainFieldId);

			if (!targetField) return fieldValue;

			// Handle Name field sub-fields
			if (targetField.type === 'name') {
				const nameMapping = {
					'2': 'prefix',
					'3': 'first',
					'4': 'middle',
					'6': 'last',
					'8': 'suffix'
				};
				const subFieldKey = nameMapping[subFieldId];
				return subFieldKey ? fieldValue[subFieldKey] : fieldValue;
			}

			// Handle Address field sub-fields
			if (targetField.type === 'address') {
				const addressMapping = {
					'1': 'street',
					'2': 'street2',
					'3': 'city',
					'4': 'state',
					'5': 'zip',
					'6': 'country'
				};
				const subFieldKey = addressMapping[subFieldId];
				return subFieldKey ? fieldValue[subFieldKey] : fieldValue;
			}

			// Handle other complex fields if needed
			return fieldValue;
		}

		return fieldValue;
	};

	/**
	 * Get the target field object
	 * @param {String} fieldId - The field ID
	 * @returns {Object|null} - The field object
	 */
	const getTargetField = (fieldId) => {
		const mainFieldId = String(fieldId).split('.')[0];
		return allFields.value?.find(f => f.id == mainFieldId);
	};

	/**
	 * Evaluate a single rule against form data
	 * @param {Object} rule - The conditional logic rule
	 * @returns {Boolean} - Whether the rule passes
	 */
	const evaluateRule = (rule) => {
		if (!rule || !rule.fieldId) return true;

		const targetFieldId = rule.fieldId;
		const targetField = getTargetField(targetFieldId);
		const fieldValue = getFieldValue(targetFieldId);
		const operator = rule.operator;
		const ruleValue = rule.value;

		// Handle empty/null values
		if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
			return operator === 'is' ? ruleValue === '' : operator === 'isnot' ? ruleValue !== '' : false;
		}

		// Get field type for special handling
		const fieldType = targetField?.type;

		// Handle different operators
		switch (operator) {
			case 'is':
				return evaluateIsOperator(fieldValue, ruleValue, fieldType);

			case 'isnot':
				return !evaluateIsOperator(fieldValue, ruleValue, fieldType);

			case 'contains':
				return evaluateContainsOperator(fieldValue, ruleValue, fieldType);

			case 'starts_with':
				return evaluateStartsWithOperator(fieldValue, ruleValue);

			case 'ends_with':
				return evaluateEndsWithOperator(fieldValue, ruleValue);

			case '>':
			case 'greater_than':
				return evaluateGreaterThan(fieldValue, ruleValue);

			case '<':
			case 'less_than':
				return evaluateLessThan(fieldValue, ruleValue);

			default:
				console.warn(`Unknown operator: ${operator}`);
				return true;
		}
	};

	/**
	 * Evaluate "is" operator
	 */
	const evaluateIsOperator = (fieldValue, ruleValue, fieldType) => {
		// Handle checkbox fields (arrays)
		if (Array.isArray(fieldValue)) {
			return fieldValue.includes(ruleValue);
		}

		// Handle name fields (objects) - when checking the whole name field, not a sub-field
		if (fieldType === 'name' && typeof fieldValue === 'object') {
			// For name fields, check if any part matches
			const nameString = Object.values(fieldValue).filter(v => v).join(' ').toLowerCase();
			return nameString.includes(ruleValue.toLowerCase());
		}

		// Handle address fields (objects) - when checking the whole address field, not a sub-field
		if (fieldType === 'address' && typeof fieldValue === 'object') {
			// For address fields, check if any part matches
			const addressString = Object.values(fieldValue).filter(v => v).join(' ').toLowerCase();
			return addressString.includes(ruleValue.toLowerCase());
		}

		// Handle multiselect
		if (fieldType === 'multiselect' && Array.isArray(fieldValue)) {
			return fieldValue.includes(ruleValue);
		}

		// Standard comparison (case-insensitive for strings)
		if (typeof fieldValue === 'string' && typeof ruleValue === 'string') {
			return fieldValue.toLowerCase() === ruleValue.toLowerCase();
		}

		return String(fieldValue) === String(ruleValue);
	};

	/**
	 * Evaluate "contains" operator
	 */
	const evaluateContainsOperator = (fieldValue, ruleValue, fieldType) => {
		// Handle arrays (checkboxes, multiselect)
		if (Array.isArray(fieldValue)) {
			return fieldValue.some(val =>
				String(val).toLowerCase().includes(String(ruleValue).toLowerCase())
			);
		}

		// Handle objects (name, address) - when checking the whole field, not a sub-field
		if (typeof fieldValue === 'object' && fieldValue !== null) {
			const objectString = Object.values(fieldValue).filter(v => v).join(' ').toLowerCase();
			return objectString.includes(String(ruleValue).toLowerCase());
		}

		// Handle strings (including sub-field values)
		if (typeof fieldValue === 'string') {
			return fieldValue.toLowerCase().includes(String(ruleValue).toLowerCase());
		}

		return String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase());
	};

	/**
	 * Evaluate "starts_with" operator
	 */
	const evaluateStartsWithOperator = (fieldValue, ruleValue) => {
		if (typeof fieldValue === 'string') {
			return fieldValue.toLowerCase().startsWith(String(ruleValue).toLowerCase());
		}
		return String(fieldValue).toLowerCase().startsWith(String(ruleValue).toLowerCase());
	};

	/**
	 * Evaluate "ends_with" operator
	 */
	const evaluateEndsWithOperator = (fieldValue, ruleValue) => {
		if (typeof fieldValue === 'string') {
			return fieldValue.toLowerCase().endsWith(String(ruleValue).toLowerCase());
		}
		return String(fieldValue).toLowerCase().endsWith(String(ruleValue).toLowerCase());
	};

	/**
	 * Evaluate "greater than" operator
	 */
	const evaluateGreaterThan = (fieldValue, ruleValue) => {
		const numValue = parseFloat(fieldValue);
		const numRule = parseFloat(ruleValue);

		if (isNaN(numValue) || isNaN(numRule)) {
			return false;
		}

		return numValue > numRule;
	};

	/**
	 * Evaluate "less than" operator
	 */
	const evaluateLessThan = (fieldValue, ruleValue) => {
		const numValue = parseFloat(fieldValue);
		const numRule = parseFloat(ruleValue);

		if (isNaN(numValue) || isNaN(numRule)) {
			return false;
		}

		return numValue < numRule;
	};

	/**
	 * Evaluate all conditional logic rules
	 * @returns {Boolean} - Whether the field should be visible
	 */
	const isFieldVisible = computed(() => {
		// If no conditional logic, field is visible
		if (!field.conditionalLogic || !field.conditionalLogic.rules) {
			return true;
		}

		const logic = field.conditionalLogic;
		const rules = logic.rules || [];
		const logicType = logic.logicType || 'all'; // 'all' or 'any'
		const actionType = logic.actionType || 'show'; // 'show' or 'hide'

		// If no rules, field is visible
		if (rules.length === 0) {
			return true;
		}

		// Evaluate all rules
		const ruleResults = rules.map(rule => evaluateRule(rule));

		// Determine if conditions are met based on logic type
		let conditionsMet;
		if (logicType === 'all') {
			conditionsMet = ruleResults.every(result => result === true);
		} else {
			conditionsMet = ruleResults.some(result => result === true);
		}

		// Apply action type
		if (actionType === 'show') {
			return conditionsMet;
		} else {
			return !conditionsMet;
		}
	});

	/**
	 * Clear field value when field becomes hidden
	 */
	watch(isFieldVisible, (newValue, oldValue) => {
		// If field was visible and now is hidden, clear its value
		if (oldValue === true && newValue === false && formData.value) {
			const fieldKey = `input_${field.id}`;

			// Determine default empty value based on field type
			if (field.type === 'checkbox' || field.type === 'multiselect') {
				formData.value[fieldKey] = [];
			} else if (field.type === 'fileupload') {
				formData.value[fieldKey] = null;
			} else if (field.type === 'address' || (field.type === 'name' && field.nameFormat !== 'simple')) {
				formData.value[fieldKey] = {};
			} else {
				formData.value[fieldKey] = '';
			}

			// Clear "other" field if exists
			if (field.enableOtherChoice) {
				formData.value[`${fieldKey}_other`] = '';
			}
		}
	});

	return {
		isFieldVisible,
		evaluateRule
	};
}
