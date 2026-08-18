<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gsection"
  >
    <h2 v-if="field.label" class="gsection_title gfield_label">{{ field.label }}</h2>
    <div
        v-if="field.description && field.descriptionPlacement === 'above'"
        class="gsection_description gfield_description description_above"
        v-html="field.description"
    ></div>
    <hr>
    <div
        v-if="field.description && field.descriptionPlacement !== 'above'"
        class="gsection_description gfield_description description_below"
        v-html="field.description"
    ></div>
  </div>
</template>

<script setup>

const props = defineProps({
  field: {
    type: Object,
    required: true
  },
  formId: {
    type: [String, Number],
    required: true
  }
})

const getFieldClasses = () => {
  const classes = [
    'gfield_contains_section',
    `gfield_visibility_${props.field.visibility || 'visible'}`
  ]

  if (props.field.size) {
    classes.push(`field_size_${props.field.size}`)
  }

  if (props.field.cssClass) {
    classes.push(props.field.cssClass)
  }

  return classes.join(' ')
}
</script>
