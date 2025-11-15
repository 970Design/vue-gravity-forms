<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gfield_price"
  >
    <label
        :for="`input_${formId}_${field.id}`"
        class="gfield_label gform-field-label"
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

    <!-- Checkbox Options -->
    <div v-if="field.inputType === 'checkbox'" class="ginput_container ginput_container_option ginput_container_checkbox">
      <div class="gfield_checkbox" :id="`input_${formId}_${field.id}`">
        <div
            v-for="(choice, index) in field.choices"
            :key="index"
            class="gchoice"
            :class="`gchoice_${formId}_${field.id}_${index}`"
        >
          <input
              :id="`choice_${formId}_${field.id}_${index}`"
              :name="`input_${field.id}.${index + 1}`"
              type="checkbox"
              :value="choice.value"
              :checked="modelValue.includes(choice.value)"
              @change="toggleCheckbox(choice.value)"
          />
          <label :for="`choice_${formId}_${field.id}_${index}`">
            {{ choice.text }}
            <span v-if="choice.price" class="ginput_option_price">
              {{ formatPriceWithCurrency(choice.price) }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Radio Options -->
    <div v-else-if="field.inputType === 'radio'" class="ginput_container ginput_container_option ginput_container_radio">
      <div class="gfield_radio" :id="`input_${formId}_${field.id}`">
        <div
            v-for="(choice, index) in field.choices"
            :key="index"
            class="gchoice"
            :class="`gchoice_${formId}_${field.id}_${index}`"
        >
          <input
              :id="`choice_${formId}_${field.id}_${index}`"
              :name="`input_${field.id}`"
              type="radio"
              :value="choice.value"
              :checked="modelValue === choice.value"
              @change="emit('update:modelValue', choice.value)"
              :required="field.isRequired"
          />
          <label :for="`choice_${formId}_${field.id}_${index}`">
            {{ choice.text }}
            <span v-if="choice.price" class="ginput_option_price">
              {{ formatPriceWithCurrency(choice.price) }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Select/Dropdown Options -->
    <div v-else-if="field.inputType === 'select'" class="ginput_container ginput_container_option ginput_container_select">
      <select
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}`"
          class="large gfield_select"
          :value="modelValue"
          @change="emit('update:modelValue', $event.target.value)"
          :required="field.isRequired"
      >
        <option value="">{{ field.placeholder || 'Select an option' }}</option>
        <option
            v-for="(choice, index) in field.choices"
            :key="index"
            :value="choice.value"
        >
          {{ choice.text }}
          <template v-if="choice.price">
            - {{ formatPriceWithCurrency(choice.price) }}
          </template>
        </option>
      </select>
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
    type: [String, Array],
    default: () => ''
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

const currencySymbol = computed(() => {
  return props.field.currencySymbol || '$'
})

const toggleCheckbox = (value) => {
  const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : []
  const index = currentValues.indexOf(value)

  if (index > -1) {
    currentValues.splice(index, 1)
  } else {
    currentValues.push(value)
  }

  emit('update:modelValue', currentValues)
}

const extractNumericPrice = (price) => {
  if (!price) return '0'
  const numericString = String(price).replace(/[^0-9.-]/g, '')
  const numPrice = parseFloat(numericString)
  return isNaN(numPrice) ? '0' : numPrice.toString()
}

const formatPrice = (price) => {
  const numPrice = parseFloat(extractNumericPrice(price))
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
}

const formatPriceWithCurrency = (price) => {
  return `${currencySymbol.value}${formatPrice(price)}`
}

const getFieldClasses = () => {
  const classes = [
    'gfield',
    `gfield--type-${props.field.type}`,
    `gfield--input-type-${props.field.inputType || 'select'}`,
    'gfield_price',
    `gfield_price_${props.formId}_${props.field.id}`,
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
