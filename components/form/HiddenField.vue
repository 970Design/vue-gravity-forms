<template>
  <input
      :id="`input_${formId}_${field.id}`"
      type="hidden"
      :name="`input_${field.id}`"
      :value="computedValue"
      :data-field-id="field.id"
      :data-field-type="field.type"
      :data-field-label="field.label"
      class="gform_hidden"
  />
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  modelValue: {
    type: [String, Number],
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

const computedValue = computed({
  get() {
    // If there's already a value, use it
    if (props.modelValue) {
      return props.modelValue
    }

    // Otherwise, use the default value from the field
    return getFieldDefaultValue()
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const getFieldDefaultValue = () => {
  // Handle different types of default values that Gravity Forms might set
  if (props.field.defaultValue) {
    return props.field.defaultValue
  }

  // Handle dynamic default values
  if (props.field.allowsPrepopulate && props.field.inputName) {
    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const paramValue = urlParams.get(props.field.inputName)
    if (paramValue) {
      return paramValue
    }
  }

  // Handle special dynamic values that Gravity Forms supports
  switch (props.field.defaultValue) {
    case '{date_mdy}':
      return new Date().toLocaleDateString('en-US')
    case '{date_dmy}':
      return new Date().toLocaleDateString('en-GB')
    case '{date_ymd}':
      return new Date().toISOString().split('T')[0]
    case '{time_12}':
      return new Date().toLocaleTimeString('en-US', { hour12: true })
    case '{time_24}':
      return new Date().toLocaleTimeString('en-US', { hour12: false })
    case '{timestamp}':
      return Date.now().toString()
    case '{user_agent}':
      return navigator.userAgent
    case '{referrer}':
      return document.referrer
    case '{url}':
      return window.location.href
    case '{ip}':
      // IP address would need to be populated server-side
      return ''
    case '{random}':
      return Math.random().toString(36).substring(2, 15)
    case '{uuid}':
      return generateUUID()
    default:
      return props.field.defaultValue || ''
  }
}

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const initializeValue = () => {
  // Set the initial value if it's not already set
  if (!props.modelValue && getFieldDefaultValue()) {
    emit('update:modelValue', getFieldDefaultValue())
  }
}

// Initialize the hidden field value when component mounts
onMounted(() => {
  initializeValue()
})

// Watch for changes in field configuration that might affect the default value
watch(() => props.field.defaultValue, () => {
  if (!props.modelValue) {
    initializeValue()
  }
})
</script>
