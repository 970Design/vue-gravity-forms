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
        class="ginput_container ginput_container_name"
        :aria-label="shouldHideLabel ? field.label : null"
    >
      <!-- Name format: Simple (single input) -->
      <div v-if="isSimpleFormat" class="ginput_full name_simple">
        <input
            :id="`input_${formId}_${field.id}`"
            :name="`input_${field.id}`"
            type="text"
            :value="modelValue"
            @input="emit('update:modelValue', $event.target.value)"
            :class="getInputClasses()"
            :placeholder="field.placeholder || ''"
            :required="field.isRequired"
            :aria-required="field.isRequired"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
            :disabled="field.disabled"
        />
      </div>

      <!-- Name format: Advanced (multiple inputs) -->
      <div v-else class="name_complex">
        <!-- Prefix -->
        <div
            v-if="isNameFieldVisible('prefix')"
            class="name_prefix"
            :class="getNameFieldWidthClass('prefix')"
        >
          <label
              :for="`input_${formId}_${field.id}_2`"
              :id="`input_${formId}_${field.id}_2_label`"
              class="gfield_label ginput_label"
          >
            {{ getNameFieldLabel('prefix') }}
            <span v-if="isNameFieldRequired('prefix')" class="gfield_required">
              <span class="gfield_required_asterisk">*</span>
            </span>
          </label>
          <select
              v-if="getNameFieldChoices('prefix')?.length"
              :id="`input_${formId}_${field.id}_2`"
              :name="`input_${field.id}[prefix]`"
              :value="getNameValue('prefix')"
              @change="updateNameField('prefix', $event.target.value)"
              :class="getInputClasses()"
              :required="isNameFieldRequired('prefix')"
              :aria-required="isNameFieldRequired('prefix')"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              :disabled="field.disabled"
          >
            <option value="">Select</option>
            <option
                v-for="choice in getNameFieldChoices('prefix')"
                :key="choice.value"
                :value="choice.value"
            >
              {{ choice.text }}
            </option>
          </select>
          <input
              v-else
              :id="`input_${formId}_${field.id}_2`"
              :name="`input_${field.id}[prefix]`"
              type="text"
              :value="getNameValue('prefix')"
              @input="updateNameField('prefix', $event.target.value)"
              :class="getInputClasses()"
              :required="isNameFieldRequired('prefix')"
              :aria-required="isNameFieldRequired('prefix')"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              :disabled="field.disabled"
          />
        </div>

        <!-- First Name -->
        <div
            v-if="isNameFieldVisible('first')"
            class="name_first"
            :class="getNameFieldWidthClass('first')"
        >
          <label
              :for="`input_${formId}_${field.id}_3`"
              :id="`input_${formId}_${field.id}_3_label`"
              class="gfield_label ginput_label"
          >
            {{ getNameFieldLabel('first') }}
            <span v-if="isNameFieldRequired('first')" class="gfield_required">
              <span class="gfield_required_asterisk">*</span>
            </span>
          </label>
          <input
              :id="`input_${formId}_${field.id}_3`"
              :name="`input_${field.id}[first]`"
              type="text"
              :value="getNameValue('first')"
              @input="updateNameField('first', $event.target.value)"
              :class="getInputClasses()"
              :required="isNameFieldRequired('first')"
              :aria-required="isNameFieldRequired('first')"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              :disabled="field.disabled"
          />
        </div>

        <!-- Middle Name -->
        <div
            v-if="isNameFieldVisible('middle')"
            class="name_middle"
            :class="getNameFieldWidthClass('middle')"
        >
          <label
              :for="`input_${formId}_${field.id}_4`"
              :id="`input_${formId}_${field.id}_4_label`"
              class="gfield_label ginput_label"
          >
            {{ getNameFieldLabel('middle') }}
            <span v-if="isNameFieldRequired('middle')" class="gfield_required">
              <span class="gfield_required_asterisk">*</span>
            </span>
          </label>
          <input
              :id="`input_${formId}_${field.id}_4`"
              :name="`input_${field.id}[middle]`"
              type="text"
              :value="getNameValue('middle')"
              @input="updateNameField('middle', $event.target.value)"
              :class="getInputClasses()"
              :required="isNameFieldRequired('middle')"
              :aria-required="isNameFieldRequired('middle')"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              :disabled="field.disabled"
          />
        </div>

        <!-- Last Name -->
        <div
            v-if="isNameFieldVisible('last')"
            class="name_last"
            :class="getNameFieldWidthClass('last')"
        >
          <label
              :for="`input_${formId}_${field.id}_6`"
              :id="`input_${formId}_${field.id}_6_label`"
              class="gfield_label ginput_label"
          >
            {{ getNameFieldLabel('last') }}
            <span v-if="isNameFieldRequired('last')" class="gfield_required">
              <span class="gfield_required_asterisk">*</span>
            </span>
          </label>
          <input
              :id="`input_${formId}_${field.id}_6`"
              :name="`input_${field.id}[last]`"
              type="text"
              :value="getNameValue('last')"
              @input="updateNameField('last', $event.target.value)"
              :class="getInputClasses()"
              :required="isNameFieldRequired('last')"
              :aria-required="isNameFieldRequired('last')"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              :disabled="field.disabled"
          />
        </div>

        <!-- Suffix -->
        <div
            v-if="isNameFieldVisible('suffix')"
            class="name_suffix"
            :class="getNameFieldWidthClass('suffix')"
        >
          <label
              :for="`input_${formId}_${field.id}_8`"
              :id="`input_${formId}_${field.id}_8_label`"
              class="gfield_label ginput_label"
          >
            {{ getNameFieldLabel('suffix') }}
            <span v-if="isNameFieldRequired('suffix')" class="gfield_required">
              <span class="gfield_required_asterisk">*</span>
            </span>
          </label>
          <select
              v-if="getNameFieldChoices('suffix')?.length"
              :id="`input_${formId}_${field.id}_8`"
              :name="`input_${field.id}[suffix]`"
              :value="getNameValue('suffix')"
              @change="updateNameField('suffix', $event.target.value)"
              :class="getInputClasses()"
              :required="isNameFieldRequired('suffix')"
              :aria-required="isNameFieldRequired('suffix')"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              :disabled="field.disabled"
          >
            <option value="">Select</option>
            <option
                v-for="choice in getNameFieldChoices('suffix')"
                :key="choice.value"
                :value="choice.value"
            >
              {{ choice.text }}
            </option>
          </select>
          <input
              v-else
              :id="`input_${formId}_${field.id}_8`"
              :name="`input_${field.id}[suffix]`"
              type="text"
              :value="getNameValue('suffix')"
              @input="updateNameField('suffix', $event.target.value)"
              :class="getInputClasses()"
              :required="isNameFieldRequired('suffix')"
              :aria-required="isNameFieldRequired('suffix')"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              :disabled="field.disabled"
          />
        </div>
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
    type: [Object, String],
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

// Check if name format is simple (single input)
const isSimpleFormat = computed(() => {
  return props.field.nameFormat === 'simple'
})

const isComplexField = computed(() => {
  return !isSimpleFormat.value
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
  prefix: 'Prefix',
  first: 'First',
  middle: 'Middle',
  last: 'Last',
  suffix: 'Suffix'
}

// Map field names to their input IDs (Gravity Forms uses specific input IDs)
const inputIdMap = {
  prefix: '2',
  first: '3',
  middle: '4',
  last: '6',
  suffix: '8'
}

// Map field names to their input array indices
const inputIndexMap = {
  prefix: 0,  // inputs[0] - ID 2
  first: 1,   // inputs[1] - ID 3
  middle: 2,  // inputs[2] - ID 4
  last: 3,    // inputs[3] - ID 6
  suffix: 4   // inputs[4] - ID 8
}

// Name field helper functions
const getNameValue = (fieldName) => {
  if (typeof props.modelValue === 'object' && props.modelValue !== null) {
    return props.modelValue[fieldName] || ''
  }
  return ''
}

const updateNameField = (fieldName, value) => {
  const currentName = typeof props.modelValue === 'object' && props.modelValue !== null
      ? { ...props.modelValue }
      : {}

  currentName[fieldName] = value
  emit('update:modelValue', currentName)
}

// Check if name field should be visible
const isNameFieldVisible = (fieldName) => {
  const inputIndex = inputIndexMap[fieldName]

  if (props.field.inputs && props.field.inputs[inputIndex]) {
    const input = props.field.inputs[inputIndex]
    return !(input.isHidden === true || input.hidden === true || input.isHidden === '1' || input.hidden === '1')
  }

  // Default visibility: first and last are shown, others hidden
  return ['first', 'last'].includes(fieldName)
}

// Get custom label or default label for name field
const getNameFieldLabel = (fieldName) => {
  const inputIndex = inputIndexMap[fieldName]

  if (props.field.inputs && props.field.inputs[inputIndex]) {
    const input = props.field.inputs[inputIndex]

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

  return defaultLabels[fieldName] || fieldName
}

// Get choices for dropdown fields (prefix/suffix)
const getNameFieldChoices = (fieldName) => {
  const inputIndex = inputIndexMap[fieldName]

  if (props.field.inputs && props.field.inputs[inputIndex]) {
    const input = props.field.inputs[inputIndex]
    if (input.choices && Array.isArray(input.choices)) {
      return input.choices
    }
  }

  return null
}

// Check if name field is required
const isNameFieldRequired = (fieldName) => {
  const inputIndex = inputIndexMap[fieldName]

  if (props.field.inputs && props.field.inputs[inputIndex]) {
    const input = props.field.inputs[inputIndex]
    return input.isRequired === true || input.isRequired === '1'
  }

  return false
}

// Get width class for name field
const getNameFieldWidthClass = (fieldName) => {
  // Gravity Forms typically uses these width classes
  // You can customize based on how many fields are visible
  const visibleFields = ['prefix', 'first', 'middle', 'last', 'suffix'].filter(f => isNameFieldVisible(f))

  if (visibleFields.length <= 2) {
    return 'ginput_left'
  } else if (visibleFields.length === 3) {
    return 'ginput_third'
  } else if (visibleFields.length === 4) {
    return 'ginput_fourth'
  } else {
    return 'ginput_fifth'
  }
}

const getFieldClasses = () => {
  const classes = [
    'gfield_contains_name',
    `field_sublabel_${props.field.subLabelPlacement || 'below'}`,
    `field_description_${props.field.descriptionPlacement || 'below'}`,
    `gfield_visibility_${props.field.visibility || 'visible'}`
  ]

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
