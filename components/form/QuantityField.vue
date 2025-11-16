<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gfield_price"
  >
    <label
        class="gfield_label gform-field-label"
        :for="`input_${formId}_${field.id}`"
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

    <div class="ginput_container ginput_container_number">
      <input
          type="number"
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}`"
          class="large"
          :value="modelValue"
          @input="updateValue($event.target.value)"
          :min="getMinValue()"
          :max="getMaxValue()"
          :step="1"
          :required="field.isRequired"
          :aria-describedby="field.description ? `gfield_description_${formId}_${field.id}` : undefined"
          :aria-invalid="hasError"
          :aria-required="field.isRequired"
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

const updateValue = (value) => {
  // Convert to number if not empty, otherwise keep as empty string
  const numericValue = value === '' ? '' : Number(value)
  emit('update:modelValue', numericValue)
}

const getMinValue = () => {
  // Check field configuration for min value, default to 0
  if (props.field.rangeMin !== undefined && props.field.rangeMin !== null) {
    return props.field.rangeMin
  }
  return 0
}

const getMaxValue = () => {
  // Check field configuration for max value
  if (props.field.rangeMax !== undefined && props.field.rangeMax !== null) {
    return props.field.rangeMax
  }
  return undefined
}

const getFieldClasses = () => {
  const classes = [
    'gfield',
    `gfield--type-${props.field.type}`,
    'gfield_price',
    `gfield_quantity_${props.formId}_${props.field.id}`,
    `field_sublabel_${props.field.subLabelPlacement || 'below'}`,
    `field_description_${props.field.descriptionPlacement || 'below'}`,
    `gfield_visibility_${props.field.visibility || 'visible'}`,
    'field_validation_below'
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

  if (props.field.cssClass) {
    classes.push(props.field.cssClass)
  }

  if (!props.field.description) {
    classes.push('gfield--no-description')
  }

  return classes.join(' ')
}
</script>
