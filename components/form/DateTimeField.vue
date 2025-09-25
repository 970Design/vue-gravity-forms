<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield"
  >
    <!-- Label -->
    <label
        :for="`input_${formId}_${field.id}`"
        class="gfield_label"
        :class="{ 'screen-reader-text': shouldHideLabel }"
    >
      {{ field.label }}
      <span v-if="field.isRequired" class="gfield_required">
        <span class="gfield_required_asterisk">*</span>
      </span>
    </label>

    <!-- Description above input -->
    <div
        v-if="field.description && field.descriptionPlacement === 'above'"
        class="gfield_description gfield_description_above_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <!-- Input Container -->
    <div class="ginput_container" :class="`ginput_container_${field.type}`">
      <template v-if="field.type === 'date'">
        <input
            :id="`input_${formId}_${field.id}`"
            :name="`input_${field.id}`"
            type="date"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            :placeholder="field.placeholder || ''"
            :required="field.isRequired"
            :disabled="field.disabled"
            :readonly="field.isReadOnly"
            :class="getInputClasses()"
            :aria-required="field.isRequired"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
        />
      </template>

      <template v-else-if="field.type === 'time'">
        <input
            :id="`input_${formId}_${field.id}`"
            :name="`input_${field.id}`"
            type="time"
            :value="displayTimeValue"
            @input="handleTimeChange"
            :placeholder="field.placeholder || ''"
            :required="field.isRequired"
            :disabled="field.disabled"
            :readonly="field.isReadOnly"
            :class="getInputClasses()"
            :aria-required="field.isRequired"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
        />
      </template>

      <template v-else-if="field.type === 'datetime'">
        <input
            :id="`input_${formId}_${field.id}`"
            :name="`input_${field.id}`"
            type="datetime-local"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            :placeholder="field.placeholder || ''"
            :required="field.isRequired"
            :disabled="field.disabled"
            :readonly="field.isReadOnly"
            :class="getInputClasses()"
            :aria-required="field.isRequired"
            :aria-invalid="hasError"
            :aria-describedby="getAriaDescribedBy()"
        />
      </template>

      <div v-else class="unsupported-field">
        <strong>Unsupported type: {{ field.type }}</strong>
      </div>
    </div>

    <!-- Description below input -->
    <div
        v-if="field.description && field.descriptionPlacement !== 'above' && field.descriptionPlacement !== 'hidden'"
        class="gfield_description gfield_description_below_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <!-- Validation error -->
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
    type: String,
    default: ''
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

// Determine if label should be hidden (but still rendered for accessibility)
const shouldHideLabel = computed(() => {
  // Hide label if labelPlacement is set to hidden_label
  if (props.field.labelPlacement === 'hidden_label') {
    return true
  }

  // Hide label if field visibility is hidden or administrative
  if (props.field.visibility === 'hidden' || props.field.visibility === 'administrative') {
    return true
  }

  return false
})

// Check if field uses 12-hour format (common Gravity Forms field property)
const uses12HourFormat = computed(() => {
  return props.field.timeFormat === '12' ||
      props.field.timeFormat === 12 ||
      (props.field.inputs && props.field.inputs.some(input => input.timeFormat === '12'))
})

// Convert 24-hour time to 12-hour format for Gravity Forms
const convertTo12Hour = (time24) => {
  if (!time24) return ''

  const [hours24, minutes] = time24.split(':')
  let hours = parseInt(hours24)
  const ampm = hours >= 12 ? 'PM' : 'AM'

  // Convert hours
  if (hours === 0) {
    hours = 12 // 00:xx becomes 12:xx AM
  } else if (hours > 12) {
    hours = hours - 12 // 13:xx becomes 1:xx PM, etc.
  }

  return `${hours}:${minutes} ${ampm}`
}

// Convert 12-hour format back to 24-hour for the input
const convertTo24Hour = (time12) => {
  if (!time12) return ''

  // Handle both "8:30 PM" and "8:30PM" formats
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return time12 // Return as-is if not in expected format

  let [, hours, minutes, ampm] = match
  hours = parseInt(hours)

  if (ampm.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12
  } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
    hours = 0
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`
}

// Computed property for displaying time in the input (always 24-hour for HTML input)
const displayTimeValue = computed(() => {
  if (props.field.type !== 'time') return props.modelValue

  // If we have a value and it looks like 12-hour format, convert to 24-hour for display
  if (props.modelValue && props.modelValue.includes(' ')) {
    return convertTo24Hour(props.modelValue)
  }

  return props.modelValue
})

// Handle time input changes
const handleTimeChange = (event) => {
  const time24 = event.target.value

  if (uses12HourFormat.value) {
    // Convert to 12-hour format for Gravity Forms
    const time12 = convertTo12Hour(time24)
    emit('update:modelValue', time12)
  } else {
    // Keep 24-hour format
    emit('update:modelValue', time24)
  }
}

const getFieldClasses = () => {
  const classes = []

  // Field type specific classes
  classes.push(`gfield_contains_${props.field.type}`)

  // Common classes
  classes.push(
      `field_sublabel_${props.field.subLabelPlacement || 'below'}`,
      `field_description_${props.field.descriptionPlacement || 'below'}`,
      `gfield_visibility_${props.field.visibility || 'visible'}`
  )

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

  // Add specific datetime/date/time classes
  if (props.field.type === 'date') {
    classes.push('gfield_contains_datepicker')
  } else if (props.field.type === 'time') {
    classes.push('gfield_contains_timepicker')
  } else if (props.field.type === 'datetime') {
    classes.push('gfield_contains_datetimepicker')
  }

  return classes.join(' ')
}

const getInputClasses = () => {
  const classes = []

  // Size classes
  if (props.field.size) {
    classes.push(props.field.size)
  } else {
    classes.push('large') // Default size
  }

  // Error state
  if (props.hasError) {
    classes.push('gfield_error')
  }

  // Date/time specific classes
  if (props.field.type === 'date') {
    classes.push('datepicker')
  } else if (props.field.type === 'time') {
    classes.push('timepicker')
  } else if (props.field.type === 'datetime') {
    classes.push('datetimepicker')
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
