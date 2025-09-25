<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gsection"
  >
    <hr>
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
