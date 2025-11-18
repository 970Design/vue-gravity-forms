<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gfield_price gfield_shipping"
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

    <!-- Single Shipping Method -->
    <div v-if="field.inputType === 'singleshipping'" class="ginput_container ginput_container_singleshipping">
      <div class="ginput_shipping_price_wrapper">
        <span class="gform-field-label gform-field-label--type-sub-large ginput_shipping_price_label">
          Shipping:
        </span>
        <span class="gform-field-label gform-field-label--type-sub-large ginput_shipping_price" :id="`input_${formId}_${field.id}`">
          {{ formatPriceWithCurrency(field.basePrice) }}
        </span>
      </div>
      <!-- Hidden input to store the shipping name -->
      <input
          type="hidden"
          :name="`input_${field.id}`"
          :value="field.label"
          class="gform_hidden"
      />
    </div>

    <!-- Radio Buttons -->
    <div v-else-if="field.inputType === 'radio'" class="ginput_container ginput_container_radio">
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
              @change="updateValue(choice.value)"
              :required="field.isRequired"
              :aria-describedby="field.description ? `gfield_description_${formId}_${field.id}` : undefined"
          />
          <label :for="`choice_${formId}_${field.id}_${index}`">
            {{ choice.text }}
            <span v-if="choice.price !== undefined && choice.price !== null && choice.price !== ''" class="ginput_shipping_price">
              {{ formatPriceWithCurrency(choice.price) }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Dropdown/Select -->
    <div v-else-if="field.inputType === 'select'" class="ginput_container ginput_container_select">
      <select
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}`"
          class="large gfield_select"
          :value="modelValue"
          @change="updateValue($event.target.value)"
          :required="field.isRequired"
          :aria-describedby="field.description ? `gfield_description_${formId}_${field.id}` : undefined"
      >
        <option value="">{{ field.placeholder || 'Select shipping method' }}</option>
        <option
            v-for="(choice, index) in field.choices"
            :key="index"
            :value="choice.value"
        >
          {{ choice.text }}
          <template v-if="choice.price !== undefined && choice.price !== null && choice.price !== ''">
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
import { computed, onMounted } from 'vue'

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

// For single shipping, automatically set the value on mount
onMounted(() => {
  if (props.field.inputType === 'singleshipping') {
    // Set the shipping name as the value
    emit('update:modelValue', props.field.label)
  }
})

const currencySymbol = computed(() => {
  // For single shipping, check basePrice
  if (props.field.inputType === 'singleshipping' && props.field.basePrice) {
    const match = String(props.field.basePrice).match(/^([^0-9]+)/)
    if (match) return match[1]
  }

  // For other types, extract from first choice price if available
  if (props.field.choices && props.field.choices.length > 0) {
    const firstPrice = props.field.choices[0].price
    if (firstPrice && typeof firstPrice === 'string') {
      const match = firstPrice.match(/^([^0-9]+)/)
      if (match) return match[1]
    }
  }
  return '$'
})

const updateValue = (value) => {
  emit('update:modelValue', value)
}

// Extract numeric price from string
const extractNumericPrice = (price) => {
  if (!price) return '0'
  const numericString = String(price).replace(/[^0-9.-]/g, '')
  const numPrice = parseFloat(numericString)
  return isNaN(numPrice) ? '0' : numPrice.toString()
}

// Format price to 2 decimal places
const formatPrice = (price) => {
  const numPrice = parseFloat(extractNumericPrice(price))
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
}

// Format price with currency symbol
const formatPriceWithCurrency = (price) => {
  return `${currencySymbol.value}${formatPrice(price)}`
}

const getFieldClasses = () => {
  const classes = [
    'gfield',
    `gfield--type-${props.field.type}`,
    `gfield--input-type-${props.field.inputType || 'select'}`,
    'gfield_price',
    'gfield_shipping',
    `gfield_shipping_${props.formId}_${props.field.id}`,
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
