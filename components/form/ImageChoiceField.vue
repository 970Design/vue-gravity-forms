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

    <div class="ginput_container ginput_container_image_choice">
      <ul
          :class="getImageChoiceListClasses()"
          :id="`input_${formId}_${field.id}`"
          :aria-label="shouldHideLabel ? field.label : null"
      >
        <li
            v-for="(choice, index) in field.choices"
            :key="`choice_${field.id}_${index}`"
            :class="getChoiceClasses(choice, index)"
        >
          <input
              :id="`choice_${formId}_${field.id}_${index}`"
              type="radio"
              :name="`input_${field.id}`"
              :value="choice.value"
              :checked="modelValue === choice.value"
              @change="$emit('update:modelValue', choice.value)"
              :required="field.isRequired"
              :aria-required="field.isRequired"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              :disabled="choice.disabled || field.disabled"
              class="gfield_image_choice_input"
              style="position: absolute; opacity: 0; pointer-events: none;"
          />
          <label
              :for="`choice_${formId}_${field.id}_${index}`"
              class="gfield_image_choice_label"
              :class="{
                'gfield_image_choice_label_disabled': choice.disabled || field.disabled,
                'gfield_image_choice_selected': modelValue === choice.value
              }"
          >
            <div class="gfield_image_choice_image_container">
              <img
                  v-if="choice.file_url"
                  :src="choice.file_url"
                  :alt="choice.text || choice.value"
                  class="gfield_image_choice_image"
                  loading="lazy"
              />
              <div
                  v-else
                  class="gfield_image_choice_placeholder"
                  :title="`No image for ${choice.text || choice.value}`"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M543.7 304.3C539.8 259.4 502 224 456 224c-17.8 0-34.8 5.3-49.2 15.2-22.5-29.5-57.3-47.2-94.8-47.2-66.2 0-120 53.8-120 120v.4c-38.3 16-64 53.5-64 95.6 0 57.3 46.7 104 104 104h304c57.3 0 104-46.7 104-104 0-54.8-42.6-99.8-96.3-103.7zM536 480H232c-39.7 0-72-32.3-72-72 0-32.3 21.9-60.7 53.3-69.2l13.3-3.6-2-17.2c-.3-2-.6-4-.6-6 0-48.5 39.5-88 88-88 32.2 0 61.8 17.9 77.2 46.8l10.6 19.8 15.2-16.5c10.8-11.7 25.4-18.1 41-18.1 30.9 0 56 25.1 56 56 0 1.6-.3 3.1-.8 6.9l-2.5 20 23.5-2.4c1.2-.2 2.5-.4 3.8-.4 39.7 0 72 32.3 72 72S575.7 480 536 480zM92.6 323l12.5-63.2c1.2-6.3-1.4-12.8-6.8-16.4l-53.5-35.8 53.5-35.8c5.4-3.6 8-10.1 6.8-16.4L92.6 92.1l63.2 12.5c6.4 1.3 12.8-1.5 16.4-6.8L208 44.3l35.8 53.5c3.6 5.3 9.9 8.1 16.4 6.8l63.2-12.5-12.5 63.2c-.3 1.6-.1 3.2 0 4.8.4 0 .7-.1 1.1-.1 10.1 0 20 1.1 29.6 3 .2-.5.5-.9.6-1.5l17.2-86.7c1-5.2-.6-10.6-4.4-14.4s-9.2-5.5-14.4-4.4l-76.2 15.1-43.1-64.4c-6-8.9-20.6-8.9-26.6 0l-43.2 64.5-76.1-15.1c-5.3-1.1-10.7.6-14.4 4.4-3.8 3.8-5.4 9.2-4.4 14.4l15.1 76.2-64.6 43.1c-4.4 3-7.1 8-7.1 13.3s2.7 10.3 7.1 13.3L71.6 264l-15.1 76.2c-1 5.2.6 10.6 4.4 14.4 3 3 7.1 4.7 11.3 4.7 1 0 2.1-.1 3.1-.3l32.8-6.5c6.2-13.8 14.6-26.5 25.1-37.6L92.6 323zM208 149.7c18.5 0 34.8 8.9 45.4 22.4 10.2-4.3 20.8-7.6 31.9-9.6-15.6-26.6-44.2-44.8-77.3-44.8-49.5 0-89.8 40.3-89.8 89.8 0 33 18.1 61.7 44.8 77.3 2-11.1 5.3-21.7 9.6-31.9-13.6-10.6-22.4-26.9-22.4-45.4 0-31.8 25.9-57.8 57.8-57.8z"/></svg>
              </div>
            </div>

            <div
                v-if="choice.text && showChoiceText"
                class="gfield_image_choice_text"
            >
              {{ choice.text }}
              <span
                  v-if="choice.price"
                  class="ginput_price"
              >
                {{ choice.price }}
              </span>
            </div>

            <!-- Selection indicator -->
            <div
                v-if="modelValue === choice.value"
                class="gfield_image_choice_selected_indicator"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="10" fill="#0073aa"/>
                <path d="M6 10L9 13L14 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </label>
        </li>
      </ul>

      <!-- "Other" option input if enabled -->
      <div
          v-if="field.enableOtherChoice && modelValue === 'gf_other_choice'"
          class="ginput_other_option"
      >
        <input
            type="text"
            :id="`input_${formId}_${field.id}_other`"
            :name="`input_${field.id}_other`"
            :placeholder="field.otherChoicePlaceholder || 'Other'"
            :value="otherValue"
            @input="$emit('update:otherValue', $event.target.value)"
            class="gfield_image_choice_other_input"
            :required="field.isRequired && modelValue === 'gf_other_choice'"
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
  },
  otherValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:otherValue'])

// Check if this is a complex field
const isComplexField = computed(() => {
  return ['image_choice'].includes(props.field.type)
})

// Determine if choice text should be shown
const showChoiceText = computed(() => {
  // Show text by default unless specifically hidden
  return props.field.showChoiceText !== false
})

// Determine if label should be hidden (but still rendered)
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
  const classes = [
    'gfield_contains_image_choice',
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

const getImageChoiceListClasses = () => {
  const classes = ['gfield_image_choice']

  // Add layout classes based on field configuration
  if (props.field.choices && props.field.choices.length > 0) {
    // Add columns class if specified
    if (props.field.columns && props.field.columns > 1) {
      classes.push(`gfield_image_choice_columns_${props.field.columns}`)
    }

    // Add size class for images
    if (props.field.imageChoiceSize) {
      classes.push(`gfield_image_choice_size_${props.field.imageChoiceSize}`)
    } else {
      classes.push('gfield_image_choice_size_medium') // default size
    }
  }

  return classes.join(' ')
}

const getChoiceClasses = (choice, index) => {
  const classes = ['gchoice', `gchoice_${props.formId}_${props.field.id}_${index}`, 'gchoice_image']

  if (choice.disabled || props.field.disabled) {
    classes.push('gchoice_disabled')
  }

  if (choice.value === props.modelValue) {
    classes.push('gchoice_selected')
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
