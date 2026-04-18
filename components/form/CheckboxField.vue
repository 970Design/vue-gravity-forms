<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield"
  >
    <!-- Consent Field Template -->
    <template v-if="isConsentField">
      <div class="ginput_container ginput_container_consent">
        <div class="gfield_consent_label">
          <input
              :id="`input_${formId}_${field.id}_1`"
              type="checkbox"
              :name="`input_${field.id}.1`"
              value="1"
              :checked="isConsentChecked"
              @change="handleConsentChange"
              :required="field.isRequired"
              :aria-required="field.isRequired"
              :aria-invalid="hasError"
              :aria-describedby="getAriaDescribedBy()"
              class="gfield_consent_checkbox"
          />
          <label
              :for="`input_${formId}_${field.id}_1`"
              class="gfield_consent_description"
          >
            <span class="gfield_consent_text" v-html="field.checkboxLabel || field.label"></span>
          </label>
        </div>
      </div>
    </template>

    <!-- Regular Checkbox Field Template -->
    <template v-else>
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

      <div class="ginput_container ginput_container_checkbox">
        <ul
            :class="getCheckboxListClasses()"
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
                :type="isRadioBacked ? 'radio' : 'checkbox'"
                :name="isRadioBacked ? `input_${field.id}` : `input_${field.id}[]`"
                :value="choice.value"
                :checked="isChoiceSelected(choice.value)"
                @change="handleChoiceChange(choice.value, $event.target.checked)"
                :required="field.isRequired && !hasAnySelection()"
                :aria-required="field.isRequired"
                :aria-invalid="hasError"
                :aria-describedby="getAriaDescribedBy()"
                :disabled="choice.disabled || field.disabled"
                :class="isRadioBacked ? 'gfield_radio' : 'gfield_checkbox'"
            />
            <label
                :for="`choice_${formId}_${field.id}_${index}`"
                class="gfield_checkbox_label"
                :class="{ 'gfield_checkbox_label_disabled': choice.disabled || field.disabled }"
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
            v-if="field.enableOtherChoice && isOtherSelected()"
            class="ginput_other_option"
        >
          <input
              type="text"
              :id="`input_${formId}_${field.id}_other`"
              :name="`input_${field.id}_other`"
              :placeholder="field.otherChoicePlaceholder || 'Other'"
              :value="otherValue"
              @input="$emit('update:otherValue', $event.target.value)"
              class="gfield_checkbox_other_input"
              :required="field.isRequired && isOtherSelected()"
          />
        </div>
      </div>
    </template>

    <!-- Common Description (below input) -->
    <div
        v-if="field.description && field.descriptionPlacement !== 'above' && field.descriptionPlacement !== 'hidden' && !isConsentField"
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
    type: [Array, String],
    default: () => []
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

const isConsentField = computed(() => {
  return props.field.type === 'consent'
})

const isComplexField = computed(() => {
  return ['checkbox', 'multi_choice'].includes(props.field.type)
})

const isRadioBacked = computed(() => {
  return props.field.inputType === 'radio'
})

const maxSelectableChoices = computed(() => {
  const limit = props.field.choiceLimit
  if (!limit || limit === 'unlimited') return Infinity
  if (limit === 'single') return 1
  const parsed = parseInt(limit, 10)
  if (!isNaN(parsed)) return parsed
  if (props.field.choiceLimitMax) return parseInt(props.field.choiceLimitMax, 10)
  return Infinity
})

const shouldHideLabel = computed(() => {
  if (isConsentField.value) return false
  if (props.field.labelPlacement === 'hidden_label') return true
  if (props.field.visibility === 'hidden' || props.field.visibility === 'administrative') return true
  return false
})

const isConsentChecked = computed(() => {
  if (!isConsentField.value) return false
  return props.modelValue === '1' || props.modelValue === 1 || props.modelValue === true
})

const handleConsentChange = (event) => {
  emit('update:modelValue', event.target.checked ? '1' : '')
}

const isChoiceSelected = (value) => {
  if (isRadioBacked.value) return props.modelValue === value
  return Array.isArray(props.modelValue) && props.modelValue.includes(value)
}

const isOtherSelected = () => {
  return isChoiceSelected('gf_other_choice')
}

const hasAnySelection = () => {
  if (isRadioBacked.value) return !!props.modelValue
  return Array.isArray(props.modelValue) && props.modelValue.length > 0
}

const handleChoiceChange = (value, checked) => {
  if (isRadioBacked.value) {
    emit('update:modelValue', checked ? value : '')
    return
  }

  let currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : []

  if (checked) {
    if (!currentValues.includes(value) && currentValues.length < maxSelectableChoices.value) {
      currentValues.push(value)
    }
  } else {
    currentValues = currentValues.filter(v => v !== value)
  }

  emit('update:modelValue', currentValues)
}

const getFieldClasses = () => {
  const classes = []

  if (isConsentField.value) {
    classes.push('gfield_contains_consent')
  } else {
    classes.push('gfield_contains_checkbox')
  }

  classes.push(
      `field_sublabel_${props.field.subLabelPlacement || 'below'}`,
      `field_description_${props.field.descriptionPlacement || 'below'}`,
      `gfield_visibility_${props.field.visibility || 'visible'}`
  )

  if (props.field.labelPlacement) {
    classes.push(`field_${props.field.labelPlacement}`)
  }

  if (props.field.isRequired) classes.push('gfield_contains_required')
  if (props.hasError) classes.push('gfield_error')
  if (props.field.size) classes.push(`field_size_${props.field.size}`)
  if (props.field.cssClass) classes.push(props.field.cssClass)

  return classes.join(' ')
}

const getCheckboxListClasses = () => {
  const classes = ['gfield_checkbox']

  if (props.field.choices && props.field.choices.length > 0) {
    if (props.field.choiceDirection === 'horizontal') {
      classes.push('gfield_checkbox_horizontal')
    }
    if (props.field.columns && props.field.columns > 1) {
      classes.push(`gfield_checkbox_columns_${props.field.columns}`)
    }
  }

  return classes.join(' ')
}

const getChoiceClasses = (choice, index) => {
  const classes = ['gchoice', `gchoice_${props.formId}_${props.field.id}_${index}`]

  if (choice.disabled || props.field.disabled) classes.push('gchoice_disabled')
  if (isChoiceSelected(choice.value)) classes.push('gchoice_selected')

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
