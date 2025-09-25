<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield"
  >
    <legend
        class="gfield_label"
        :class="{ 'gfield_label_before_complex': isComplexField }"
    >
      {{ field.label }}
      <span v-if="field.isRequired" class="gfield_required">
        <span class="gfield_required_asterisk">*</span>
      </span>
    </legend>

    <div
        v-if="field.description && field.descriptionPlacement === 'above'"
        class="gfield_description gfield_description_above_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <div
        class="ginput_container ginput_container_address"
        :aria-label="shouldHideLabel ? field.label : null"
    >
      <!-- Street Address -->
      <div
          v-if="isAddressFieldVisible('street')"
          class="ginput_full address_line_1 ginput_address_line_1"
      >
        <label
            :for="`input_${formId}_${field.id}_1`"
            :id="`input_${formId}_${field.id}_1_label`"
            class="gfield_label ginput_label"
        >
          {{ getAddressFieldLabel('street') }}
          <span v-if="isAddressFieldRequired('street')" class="gfield_required">
            <span class="gfield_required_asterisk">*</span>
          </span>
        </label>
        <input
            :id="`input_${formId}_${field.id}_1`"
            :name="`input_${field.id}[street]`"
            type="text"
            :value="getAddressValue('street')"
            @input="updateAddressField('street', $event.target.value)"
            :class="getInputClasses()"
            :required="isAddressFieldRequired('street')"
            :aria-required="isAddressFieldRequired('street')"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        />
      </div>

      <!-- Address Line 2 -->
      <div
          v-if="isAddressFieldVisible('street2')"
          class="ginput_full address_line_2 ginput_address_line_2"
      >
        <label
            :for="`input_${formId}_${field.id}_2`"
            :id="`input_${formId}_${field.id}_2_label`"
            class="gfield_label ginput_label"
        >
          {{ getAddressFieldLabel('street2') }}
          <span v-if="isAddressFieldRequired('street2')" class="gfield_required">
            <span class="gfield_required_asterisk">*</span>
          </span>
        </label>
        <input
            :id="`input_${formId}_${field.id}_2`"
            :name="`input_${field.id}[street2]`"
            type="text"
            :value="getAddressValue('street2')"
            @input="updateAddressField('street2', $event.target.value)"
            :class="getInputClasses()"
            :required="isAddressFieldRequired('street2')"
            :aria-required="isAddressFieldRequired('street2')"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        />
      </div>

      <!-- City -->
      <div
          v-if="isAddressFieldVisible('city')"
          class="ginput_left address_city ginput_address_city"
      >
        <label
            :for="`input_${formId}_${field.id}_3`"
            :id="`input_${formId}_${field.id}_3_label`"
            class="gfield_label ginput_label"
        >
          {{ getAddressFieldLabel('city') }}
          <span v-if="isAddressFieldRequired('city')" class="gfield_required">
            <span class="gfield_required_asterisk">*</span>
          </span>
        </label>
        <input
            :id="`input_${formId}_${field.id}_3`"
            :name="`input_${field.id}[city]`"
            type="text"
            :value="getAddressValue('city')"
            @input="updateAddressField('city', $event.target.value)"
            :class="getInputClasses()"
            :required="isAddressFieldRequired('city')"
            :aria-required="isAddressFieldRequired('city')"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        />
      </div>

      <!-- State/Province -->
      <div
          v-if="isAddressFieldVisible('state')"
          class="ginput_right address_state ginput_address_state"
      >
        <label
            :for="`input_${formId}_${field.id}_4`"
            :id="`input_${formId}_${field.id}_4_label`"
            class="gfield_label ginput_label"
        >
          {{ getAddressFieldLabel('state') }}
          <span v-if="isAddressFieldRequired('state')" class="gfield_required">
            <span class="gfield_required_asterisk">*</span>
          </span>
        </label>
        <!-- State dropdown if choices are provided, otherwise text input -->
        <select
            v-if="getAddressFieldChoices('state')?.length"
            :id="`input_${formId}_${field.id}_4`"
            :name="`input_${field.id}[state]`"
            :value="getAddressValue('state')"
            @change="updateAddressField('state', $event.target.value)"
            :class="getInputClasses()"
            :required="isAddressFieldRequired('state')"
            :aria-required="isAddressFieldRequired('state')"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        >
          <option value="">Select a State</option>
          <option
              v-for="choice in getAddressFieldChoices('state')"
              :key="choice.value"
              :value="choice.value"
          >
            {{ choice.text }}
          </option>
        </select>
        <input
            v-else
            :id="`input_${formId}_${field.id}_4`"
            :name="`input_${field.id}[state]`"
            type="text"
            :value="getAddressValue('state')"
            @input="updateAddressField('state', $event.target.value)"
            :class="getInputClasses()"
            :required="isAddressFieldRequired('state')"
            :aria-required="isAddressFieldRequired('state')"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        />
      </div>

      <!-- ZIP/Postal Code -->
      <div
          v-if="isAddressFieldVisible('zip')"
          class="ginput_left address_zip ginput_address_zip"
      >
        <label
            :for="`input_${formId}_${field.id}_5`"
            :id="`input_${formId}_${field.id}_5_label`"
            class="gfield_label ginput_label"
        >
          {{ getAddressFieldLabel('zip') }}
          <span v-if="isAddressFieldRequired('zip')" class="gfield_required">
            <span class="gfield_required_asterisk">*</span>
          </span>
        </label>
        <input
            :id="`input_${formId}_${field.id}_5`"
            :name="`input_${field.id}[zip]`"
            type="text"
            :value="getAddressValue('zip')"
            @input="updateAddressField('zip', $event.target.value)"
            :class="getInputClasses()"
            :required="isAddressFieldRequired('zip')"
            :aria-required="isAddressFieldRequired('zip')"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        />
      </div>

      <!-- Country -->
      <div
          v-if="isAddressFieldVisible('country')"
          class="ginput_right address_country ginput_address_country"
      >
        <label
            :for="`input_${formId}_${field.id}_6`"
            :id="`input_${formId}_${field.id}_6_label`"
            class="gfield_label ginput_label"
        >
          {{ getAddressFieldLabel('country') }}
          <span v-if="isAddressFieldRequired('country')" class="gfield_required">
            <span class="gfield_required_asterisk">*</span>
          </span>
        </label>
        <!-- Country dropdown if choices are provided, otherwise text input -->
        <select
            v-if="getAddressFieldChoices('country')?.length"
            :id="`input_${formId}_${field.id}_6`"
            :name="`input_${field.id}[country]`"
            :value="getAddressValue('country')"
            @change="updateAddressField('country', $event.target.value)"
            :class="getInputClasses()"
            :required="isAddressFieldRequired('country')"
            :aria-required="isAddressFieldRequired('country')"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        >
          <option value="">Select a Country</option>
          <option
              v-for="choice in getAddressFieldChoices('country')"
              :key="choice.value"
              :value="choice.value"
          >
            {{ choice.text }}
          </option>
        </select>
        <input
            v-else
            :id="`input_${formId}_${field.id}_6`"
            :name="`input_${field.id}[country]`"
            type="text"
            :value="getAddressValue('country')"
            @input="updateAddressField('country', $event.target.value)"
            :class="getInputClasses()"
            :required="isAddressFieldRequired('country')"
            :aria-required="isAddressFieldRequired('country')"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        />
      </div>
    </div>

    <div
        v-if="field.description && field.descriptionPlacement !== 'above' && field.descriptionPlacement !== 'hidden'"
        class="gfield_description gfield_description_below_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <div
        v-if="hasError && errorMessage"
        class="gfield_validation_message"
        :id="`validation_message_${formId}_${field.id}`"
    >
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  formId: {
    type: [String, Number],
    required: true
  },
  errorMessage: {
    type: String,
    default: ''
  },
  hasError: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const isComplexField = computed(() => {
  return true // Address is always a complex field
})

const shouldHideLabel = computed(() => {
  if (props.field.labelPlacement === 'hidden_label') {
    return true
  }

  if (props.field.visibility === 'hidden' || props.field.visibility === 'administrative') {
    return true
  }

  return false
})

// Default labels mapping
const defaultLabels = {
  street: 'Street Address',
  street2: 'Address Line 2',
  city: 'City',
  state: 'State / Province',
  zip: 'ZIP / Postal Code',
  country: 'Country'
}

// Address field helper functions
const getAddressValue = (fieldName) => {
  if (typeof props.modelValue === 'object' && props.modelValue !== null) {
    return props.modelValue[fieldName] || ''
  }
  return ''
}

const updateAddressField = (fieldName, value) => {
  const currentAddress = typeof props.modelValue === 'object' && props.modelValue !== null
      ? { ...props.modelValue }
      : {}

  currentAddress[fieldName] = value
  emit('update:modelValue', currentAddress)
}

// Map field names to their input array indices (Gravity Forms uses indexed inputs)
const inputIndexMap = {
  street: 0,   // inputs[0]
  street2: 1,  // inputs[1]
  city: 2,     // inputs[2]
  state: 3,    // inputs[3]
  zip: 4,      // inputs[4]
  country: 5   // inputs[5]
}

// Check if address field should be visible
const isAddressFieldVisible = (fieldName) => {
  const inputIndex = inputIndexMap[fieldName]

  // Check if field inputs array exists and has the input
  if (props.field.inputs && props.field.inputs[inputIndex]) {
    const input = props.field.inputs[inputIndex]

    // Check various possible hidden properties
    return !(input.isHidden === true || input.hidden === true || input.isHidden === '1' || input.hidden === '1')
  }

  // Default visibility based on Gravity Forms defaults
  // Street, city, state, zip are typically shown by default
  // Street2 and country are typically hidden by default unless address type requires them
  if (fieldName === 'street2') {
    return false // Hidden by default
  }

  if (fieldName === 'country') {
    // Country is shown for international address type, hidden for US/Canadian
    return props.field.addressType === 'international' || !props.field.addressType
  }

  return true // Show street, city, state, zip by default
}

// Get custom label or default label for address field
const getAddressFieldLabel = (fieldName) => {
  const inputIndex = inputIndexMap[fieldName]

  // Check if field inputs array exists and has the input
  if (props.field.inputs && props.field.inputs[inputIndex]) {
    const input = props.field.inputs[inputIndex]

    // Check various possible label properties
    if (input.customLabel) {
      return input.customLabel
    }
    if (input.label) {
      return input.label
    }
    if (input.sublabel) {
      return input.sublabel
    }
    if (input.subLabel) {
      return input.subLabel
    }
  }

  // Return default label
  return defaultLabels[fieldName] || fieldName
}

// Get choices for dropdown fields (state/country)
const getAddressFieldChoices = (fieldName) => {
  const inputIndex = inputIndexMap[fieldName]

  if (props.field.inputs && props.field.inputs[inputIndex]) {
    const input = props.field.inputs[inputIndex]
    if (input.choices && Array.isArray(input.choices)) {
      return input.choices
    }
  }

  return null
}

const isAddressFieldRequired = (fieldName) => {
  const inputIndex = inputIndexMap[fieldName]

  if (props.field.inputs && props.field.inputs[inputIndex]) {
    const input = props.field.inputs[inputIndex]
    return input.isRequired === true || input.isRequired === '1'
  }

  // Default required fields for address (based on typical Gravity Forms behavior)
  return ['street', 'city', 'state', 'zip'].includes(fieldName)
}

const getFieldClasses = () => {
  const classes = [
    'gfield_contains_address',
    `field_sublabel_${props.field.subLabelPlacement || 'below'}`,
    `field_description_${props.field.descriptionPlacement || 'below'}`,
    `gfield_visibility_${props.field.visibility || 'visible'}`
  ]

  // Add label placement class
  if (props.field.labelPlacement) {
    classes.push(`field_${props.field.labelPlacement}`)
  }

  if (props.field.isRequired) {
    classes.push('gfield_contains_required')
  }

  if (props.hasError) {
    classes.push('gfield_error')
  }

  if (props.field.size) {
    classes.push(`field_size_${props.field.size}`)
  }

  if (props.field.cssClass) {
    classes.push(props.field.cssClass)
  }

  return classes.join(' ')
}

const getInputClasses = () => {
  const classes = [props.field.size || 'large']

  if (props.hasError) {
    classes.push('gfield_error')
  }

  return classes.join(' ')
}

const getAriaDescribedBy = () => {
  const describedBy = []

  if (props.field.description && props.field.descriptionPlacement !== 'hidden') {
    describedBy.push(`gfield_description_${props.formId}_${props.field.id}`)
  }

  if (props.hasError) {
    describedBy.push(`validation_message_${props.formId}_${props.field.id}`)
  }

  return describedBy.length > 0 ? describedBy.join(' ') : null
}
</script>
