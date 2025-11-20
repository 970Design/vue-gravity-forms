<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gfield_price"
  >
    <label
        class="gfield_label gform-field-label"
        :class="{ 'gfield_label_before_complex': field.inputType === 'singleproduct' && !field.disableQuantity }"
        :for="field.inputType === 'singleproduct' ? `input_${formId}_${field.id}_1` : `input_${formId}_${field.id}`"
    >
      <span class="gform-field-label gfield_label_product">{{ field.label }}</span>
      <span v-if="field.isRequired" class="gfield_required">
        <span class="gfield_required_asterisk">*</span>
      </span>
      <span v-if="field.inputType === 'singleproduct' && !field.disableQuantity" class="gfield_visibility_hidden">Quantity</span>
    </label>

    <div
        v-if="field.description && field.descriptionPlacement === 'above'"
        class="gfield_description gfield_description_above_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <!-- Product Field (Radio, Select, or Single Product) -->
    <div v-if="field.inputType === 'singleproduct'" class="ginput_container ginput_container_product ginput_container_singleproduct">
      <!-- Hidden product name -->
      <input
          type="hidden"
          :name="`input_${field.id}.1`"
          :value="field.label"
          class="gform_hidden"
      />

      <!-- Price display (non-editable) -->
      <div :id="`ginput_product_price_${formId}_${field.id}`" class="ginput_product_price_wrapper">
        <span class="gform-field-label gform-field-label--type-sub-large ginput_product_price_label">
          Price:
        </span>
        <span class="gform-field-label gform-field-label--type-sub-large ginput_product_price" :id="`input_${formId}_${field.id}`">
          {{ formatPriceWithCurrency(field.basePrice) }}
        </span>
      </div>

      <!-- Hidden base price -->
      <input
          type="hidden"
          :name="`input_${field.id}.2`"
          :id="`ginput_base_price_${formId}_${field.id}`"
          class="gform_hidden"
          :value="formatPriceWithCurrency(field.basePrice)"
      />

      <!-- Quantity input - check disableQuantity flag AND if separate quantity field is mapped -->
      <template v-if="!field.disableQuantity && !hasQuantityFieldMapping()">
        <label
            :for="`ginput_quantity_${formId}_${field.id}_1`"
            class="ginput_quantity_label gform-field-label"
            aria-hidden="true"
        >
          Quantity
        </label>
        <input
            type="number"
            :name="`input_${field.id}.3`"
            :id="`input_${formId}_${field.id}_1`"
            class="ginput_quantity"
            size="10"
            min="0"
            :value="getQuantityValue()"
            @input="updateValue('quantity', $event.target.value)"
            :aria-label="`Quantity ${field.label}`"
            :aria-describedby="`ginput_product_price_${formId}_${field.id}`"
        />
      </template>
    </div>

    <!-- Radio Product Selection -->
    <div v-else-if="field.inputType === 'radio'" class="ginput_container ginput_container_product ginput_container_radio">
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
              :checked="modelValue.value === choice.value"
              @change="selectProduct(choice)"
              :required="field.isRequired"
          />
          <label :for="`choice_${formId}_${field.id}_${index}`">
            {{ choice.text }}
            <span v-if="choice.price !== undefined && choice.price !== null && choice.price !== ''" class="ginput_product_price">
              {{ formatPriceWithCurrency(choice.price) }}
            </span>
          </label>
        </div>
      </div>
      <template v-if="!field.disableQuantity">
        <div class="ginput_quantity">
          <label :for="`input_${formId}_${field.id}_3`" class="ginput_quantity_label">
            Quantity
          </label>
          <input
              :id="`input_${formId}_${field.id}_3`"
              :name="`input_${field.id}.3`"
              type="number"
              :value="modelValue.quantity || ''"
              @input="updateValue('quantity', $event.target.value)"
              min="0"
              class="large ginput_quantity"
          />
        </div>
      </template>
    </div>

    <!-- Select/Dropdown Product Selection -->
    <div v-else-if="field.inputType === 'select'" class="ginput_container ginput_container_product ginput_container_select">
      <select
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}`"
          class="large gfield_select"
          :value="modelValue.value"
          @change="selectProductFromDropdown($event)"
          :required="field.isRequired"
      >
        <option value="">{{ field.placeholder || 'Select a product' }}</option>
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
      <template v-if="!field.disableQuantity">
        <div class="ginput_quantity">
          <label :for="`input_${formId}_${field.id}_3`" class="ginput_quantity_label">
            Quantity
          </label>
          <input
              :id="`input_${formId}_${field.id}_3`"
              :name="`input_${field.id}.3`"
              type="number"
              :value="modelValue.quantity || ''"
              @input="updateValue('quantity', $event.target.value)"
              min="0"
              class="large ginput_quantity"
          />
        </div>
      </template>
    </div>

    <!-- Hidden Product (for calculations only) -->
    <div v-else-if="field.inputType === 'hiddenproduct'" class="ginput_container ginput_container_product">
      <input
          type="hidden"
          :name="`input_${field.id}.1`"
          :value="field.label"
      />
      <input
          type="hidden"
          :name="`input_${field.id}.2`"
          :value="extractNumericPrice(field.basePrice)"
      />
      <input
          v-if="!field.disableQuantity"
          type="hidden"
          :name="`input_${field.id}.3`"
          :value="modelValue.quantity || 1"
      />
    </div>

    <!-- Calculation Product -->
    <div v-else-if="field.inputType === 'calculation'" class="ginput_container ginput_container_product ginput_container_calculation">
      <div class="ginput_product_price_wrapper">
        <label class="ginput_product_price_label">Product Name</label>
        <div class="ginput_product_name">{{ field.label }}</div>
      </div>
      <div class="ginput_product_price_wrapper">
        <label class="ginput_product_price_label">Price</label>
        <div class="ginput_price_display">
          {{ formatPriceWithCurrency(modelValue.price || '0') }}
        </div>
      </div>
      <input
          type="hidden"
          :name="`input_${field.id}.1`"
          :value="field.label"
      />
      <input
          type="hidden"
          :name="`input_${field.id}.2`"
          :value="extractNumericPrice(modelValue.price || '0')"
      />
    </div>

    <!-- User Defined Price Product -->
    <div v-else-if="field.inputType === 'price'" class="ginput_container ginput_container_product ginput_container_price">
      <!-- Product Name (hidden) -->
      <input
          type="hidden"
          :name="`input_${field.id}.1`"
          :value="field.label"
      />

      <!-- User-entered Price Input -->
      <div class="ginput_product_price_wrapper">
        <label
            :for="`input_${formId}_${field.id}_2`"
            class="ginput_product_price_label gform-field-label"
        >
          Price
        </label>
        <div class="ginput_price">
          <span class="ginput_currency_symbol">{{ currencySymbol }}</span>
          <input
              type="number"
              :id="`input_${formId}_${field.id}_2`"
              :name="`input_${field.id}.2`"
              class="ginput_amount"
              step="0.01"
              min="0"
              :value="modelValue.price || ''"
              @input="updateValue('price', $event.target.value)"
              :required="field.isRequired"
              :aria-label="`Price for ${field.label}`"
          />
        </div>
      </div>

      <!-- Quantity (if enabled) -->
      <template v-if="!field.disableQuantity">
        <div class="ginput_quantity">
          <label
              :for="`input_${formId}_${field.id}_3`"
              class="ginput_quantity_label gform-field-label"
          >
            Quantity
          </label>
          <input
              :id="`input_${formId}_${field.id}_3`"
              :name="`input_${field.id}.3`"
              type="number"
              :value="modelValue.quantity || ''"
              @input="updateValue('quantity', $event.target.value)"
              min="0"
              class="large ginput_quantity"
          />
        </div>
      </template>
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
import { computed, inject } from 'vue'

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
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

const formData = inject('formData', { value: {} })
const allFields = inject('allFields', { value: [] })

const currencySymbol = computed(() => {
  // Extract currency symbol from basePrice if available, otherwise default to $
  if (props.field.basePrice && typeof props.field.basePrice === 'string') {
    const match = props.field.basePrice.match(/^([^0-9]+)/)
    if (match) return match[1]
  }
  return '$'
})

const updateValue = (key, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}

const selectProduct = (choice) => {
  emit('update:modelValue', {
    value: choice.value,
    text: choice.text,
    price: extractNumericPrice(choice.price || '0'),
    quantity: props.modelValue.quantity || ''
  })
}

const selectProductFromDropdown = (event) => {
  const selectedValue = event.target.value
  const choice = props.field.choices.find(c => c.value === selectedValue)

  if (choice) {
    selectProduct(choice)
  } else {
    emit('update:modelValue', {
      value: '',
      text: '',
      price: '0',
      quantity: ''
    })
  }
}

// Extract numeric price from string (removes currency symbols and formatting)
const extractNumericPrice = (price) => {
  if (!price) return '0'
  // Remove everything except digits, dots, and minus sign
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

// Check if this product has a separate Quantity field mapped to it
const hasQuantityFieldMapping = () => {
  if (!allFields.value || allFields.value.length === 0) {
    return false
  }

  const quantityFields = allFields.value.filter(f => f.type === 'quantity')

  const hasMapping = allFields.value.some(field => {
    const isMatch = field.type === 'quantity' &&
        field.productField &&
        field.productField == props.field.id

    return isMatch
  })

  return hasMapping
}

// Get the mapped quantity field object (if exists)
const getMappedQuantityField = () => {
  if (!allFields.value || allFields.value.length === 0) {
    return null
  }

  const mappedField = allFields.value.find(field => {
    return field.type === 'quantity' &&
        field.productField &&
        field.productField == props.field.id
  })

  return mappedField
}

// Get the quantity value - either from mapped field or from product's own quantity
const getQuantityValue = () => {
  const mappedQuantityField = getMappedQuantityField()

  if (mappedQuantityField) {
    const quantityFieldKey = `input_${mappedQuantityField.id}`
    return formData.value[quantityFieldKey] || ''
  }

  return props.modelValue.quantity || ''
}

const getFieldClasses = () => {
  const classes = [
    'gfield',
    `gfield--type-${props.field.type}`,
    `gfield--input-type-${props.field.inputType || 'text'}`,
    'gfield_price',
    `gfield_price_${props.formId}_${props.field.id}`,
    `gfield_product_${props.formId}_${props.field.id}`,
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
