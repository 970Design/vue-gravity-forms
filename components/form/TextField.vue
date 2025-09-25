<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield"
  >
    <label
        :for="`input_${formId}_${field.id}`"
        class="gfield_label"
        :class="{ 'gfield_label_before_complex': isComplexField }"
    >
      {{ field.label }}
      <span v-if="field.isRequired" class="gfield_required">
        <span class="gfield_required_asterisk">*</span>
      </span>
    </label>

    <div
        v-if="field.description && field.descriptionPlacement === 'above'"
        class="gfield_description gfield_description_above_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <div class="ginput_container ginput_container_text">
      <input
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}`"
          :type="getInputType()"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          :class="getInputClasses()"
          :placeholder="field.placeholder || ''"
          :required="field.isRequired"
          :maxlength="field.maxLength || null"
          :aria-required="field.isRequired"
          :aria-invalid="hasError"
          :aria-describedby="getAriaDescribedBy()"
          :aria-label="shouldHideLabel ? field.label : null"
          :disabled="field.disabled"
      />
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

const isComplexField = computed(() => {
  return ['name', 'credit_card'].includes(props.field.type)
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

const getInputType = () => {
  switch (props.field.type) {
    case 'email':
      return 'email'
    case 'number':
      return 'number'
    case 'phone':
      return 'tel'
    case 'website':
      return 'url'
    case 'password':
      return 'password'
    default:
      return 'text'
  }
}

const getFieldClasses = () => {
  const classes = [
    `gfield_contains_${props.field.type}`,
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
