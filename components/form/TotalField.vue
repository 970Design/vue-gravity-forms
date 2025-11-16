<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gfield_price gfield_total"
  >
    <label
        :for="`input_${formId}_${field.id}`"
        class="gfield_label"
    >
      {{ field.label }}
    </label>

    <div
        v-if="field.description && field.descriptionPlacement === 'above'"
        class="gfield_description gfield_description_above_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <div class="ginput_container ginput_container_total">
      <span :class="`ginput_total ginput_total_${formId}`">
        {{ currencySymbol }}{{ formatPrice(calculatedTotal) }}
      </span>
      <input
          type="hidden"
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}`"
          :value="calculatedTotal"
          class="gform_hidden"
      />
    </div>

    <div
        v-if="field.description && field.descriptionPlacement !== 'above' && field.descriptionPlacement !== 'hidden'"
        class="gfield_description gfield_description_below_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
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
    type: [String, Number],
    default: '0'
  },
  formId: {
    type: [String, Number],
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

// Inject formData and allFields from parent component
const formData = inject('formData', null)
const allFields = inject('allFields', null)

const currencySymbol = computed(() => {
  return props.field.currencySymbol || '$'
})

// Get mapped quantity field for a product
const getMappedQuantityField = (productFieldId) => {
  if (!allFields?.value || allFields.value.length === 0) return null

  return allFields.value.find(field => {
    return field.type === 'quantity' &&
        field.productField &&
        field.productField == productFieldId
  })
}

const calculatedTotal = computed(() => {
  if (!formData?.value || !allFields?.value) {
    return '0.00'
  }

  let total = 0

  // Iterate through all fields to find pricing fields
  allFields.value.forEach(field => {
    if (field.type === 'page') return

    const fieldKey = `input_${field.id}`
    const fieldValue = formData.value[fieldKey]

    // Product fields
    if (field.type === 'product' && fieldValue) {
      let productPrice = 0
      let quantity = 1

      if (field.inputType === 'singleproduct') {
        productPrice = parseFloat(extractNumericPrice(field.basePrice))

        // Check for mapped quantity field first
        const mappedQuantityField = getMappedQuantityField(field.id)
        if (mappedQuantityField) {
          const quantityFieldKey = `input_${mappedQuantityField.id}`
          quantity = parseInt(formData.value[quantityFieldKey]) || 0
        } else {
          quantity = parseInt(fieldValue.quantity) || 0
        }

      } else if (field.inputType === 'radio' || field.inputType === 'select') {
        productPrice = parseFloat(extractNumericPrice(fieldValue.price || '0'))

        // Check for mapped quantity field
        const mappedQuantityField = getMappedQuantityField(field.id)
        if (mappedQuantityField) {
          const quantityFieldKey = `input_${mappedQuantityField.id}`
          quantity = parseInt(formData.value[quantityFieldKey]) || 0
        } else if (!field.disableQuantity) {
          quantity = parseInt(fieldValue.quantity) || 0
        }

      } else if (field.inputType === 'hiddenproduct') {
        productPrice = parseFloat(extractNumericPrice(field.basePrice))

        // Check for mapped quantity field
        const mappedQuantityField = getMappedQuantityField(field.id)
        if (mappedQuantityField) {
          const quantityFieldKey = `input_${mappedQuantityField.id}`
          quantity = parseInt(formData.value[quantityFieldKey]) || 1
        } else if (!field.disableQuantity) {
          quantity = fieldValue.quantity || 1
        }

      } else if (field.inputType === 'calculation') {
        productPrice = parseFloat(extractNumericPrice(fieldValue.price || '0'))
        quantity = 1

      } else if (field.inputType === 'price') {
        productPrice = parseFloat(extractNumericPrice(fieldValue.price || '0'))

        // Check for mapped quantity field
        const mappedQuantityField = getMappedQuantityField(field.id)
        if (mappedQuantityField) {
          const quantityFieldKey = `input_${mappedQuantityField.id}`
          quantity = parseInt(formData.value[quantityFieldKey]) || 0
        } else if (!field.disableQuantity) {
          quantity = parseInt(fieldValue.quantity) || 0
        }
      }

      if (!isNaN(productPrice) && !isNaN(quantity) && quantity > 0) {
        const subtotal = productPrice * quantity
        total += subtotal
      }
    }

    // Option fields
    if (field.type === 'option' && fieldValue) {
      if (field.inputType === 'checkbox' && Array.isArray(fieldValue)) {
        fieldValue.forEach(selectedValue => {
          const choice = field.choices?.find(c => c.value === selectedValue)
          if (choice?.price) {
            const optionPrice = parseFloat(extractNumericPrice(choice.price))
            if (!isNaN(optionPrice)) {
              total += optionPrice
            }
          }
        })
      } else {
        const choice = field.choices?.find(c => c.value === fieldValue)
        if (choice?.price) {
          const optionPrice = parseFloat(extractNumericPrice(choice.price))
          if (!isNaN(optionPrice)) {
            total += optionPrice
          }
        }
      }
    }

    // Shipping fields
    if (field.type === 'shipping' && fieldValue) {
      const choice = field.choices?.find(c => c.value === fieldValue)
      if (choice?.price) {
        const shippingPrice = parseFloat(extractNumericPrice(choice.price))
        if (!isNaN(shippingPrice)) {
          total += shippingPrice
        }
      }
    }
  })

  const totalStr = total.toFixed(2)

  // Update parent's modelValue
  if (totalStr !== props.modelValue) {
    emit('update:modelValue', totalStr)
  }

  return totalStr
})

const extractNumericPrice = (price) => {
  if (!price) return '0'
  const numericString = String(price).replace(/[^0-9.-]/g, '')
  const numPrice = parseFloat(numericString)
  return isNaN(numPrice) ? '0' : numPrice.toString()
}

const formatPrice = (price) => {
  if (!price) return '0.00'
  const numPrice = parseFloat(price)
  return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)
}

const getFieldClasses = () => {
  const classes = [
    `gfield_contains_${props.field.type}`,
    `field_sublabel_${props.field.subLabelPlacement || 'below'}`,
    `field_description_${props.field.descriptionPlacement || 'below'}`,
    `gfield_visibility_${props.field.visibility || 'visible'}`
  ]

  if (props.field.labelPlacement) {
    classes.push(`field_${props.field.labelPlacement}`)
  }

  if (props.field.cssClass) {
    classes.push(props.field.cssClass)
  }

  return classes.join(' ')
}
</script>
