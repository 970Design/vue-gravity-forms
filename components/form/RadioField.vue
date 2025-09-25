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

    <div class="ginput_container ginput_container_radio">
      <ul
          :class="getRadioListClasses()"
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
              class="gfield_radio"
          />
          <label
              :for="`choice_${formId}_${field.id}_${index}`"
              class="gfield_radio_label"
              :class="{ 'gfield_radio_label_disabled': choice.disabled || field.disabled }"
          >
            {{ choice.text }}
            <span
                v-if="choice.price"
                class="ginput_price"
            >
              {{ choice.price }}
            </span>
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
            class="gfield_radio_other_input"
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
  return ['radio', 'multi_choice'].includes(props.field.type)
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
    'gfield_contains_radio',
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

const getRadioListClasses = () => {
  const classes = ['gfield_radio']

  // Add layout classes based on field configuration
  if (props.field.choices && props.field.choices.length > 0) {
    if (props.field.choiceDirection === 'horizontal') {
      classes.push('gfield_radio_horizontal')
    }

    if (props.field.columns && props.field.columns > 1) {
      classes.push(`gfield_radio_columns_${props.field.columns}`)
    }
  }

  return classes.join(' ')
}

const getChoiceClasses = (choice, index) => {
  const classes = ['gchoice', `gchoice_${props.formId}_${props.field.id}_${index}`]

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
