<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield"
  >
    <label
        :for="`input_${formId}_${field.id}`"
        class="gfield_label"
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

    <div class="ginput_container" :class="`ginput_container_${field.type}`">
      <textarea
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}`"
          :placeholder="field.placeholder || ''"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          :required="field.isRequired"
          :disabled="field.disabled"
          :readonly="field.isReadOnly"
          :maxlength="field.maxLength"
          :rows="field.rows || 10"
          :cols="field.cols || 50"
          :aria-required="field.isRequired"
          :aria-invalid="hasError"
          :aria-describedby="getAriaDescribedBy()"
          :class="getTextareaClasses()"
          class="textarea"
      />

      <!-- Character/Word counter if maxLength is set -->
      <div
          v-if="field.maxLength"
          class="ginput_counter"
          :class="{ 'ginput_counter_tinymce': field.useRichTextEditor }"
      >
        <span class="ginput_counter_message">
          {{ modelValue ? modelValue.length : 0 }} / {{ field.maxLength }}
        </span>
      </div>
    </div>

    <!-- Description below input (default) -->
    <div
        v-if="field.description && field.descriptionPlacement !== 'above' && field.descriptionPlacement !== 'hidden'"
        class="gfield_description gfield_description_below_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <!-- Validation Error -->
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

  // Add specific textarea classes
  if (props.field.useRichTextEditor) {
    classes.push('gfield_contains_richtext')
  }

  return classes.join(' ')
}

const getTextareaClasses = () => {
  const classes = []

  // Size classes
  if (props.field.size) {
    classes.push(props.field.size)
  }

  // Rich text editor class
  if (props.field.useRichTextEditor) {
    classes.push('wp-editor-area')
  }

  // Error state
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
