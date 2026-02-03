<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gfield_html gfield_html_formatted gfield_no_follows_desc"
  >
    <div
        class="ginput_container ginput_container_html"
        v-html="field.content"
    ></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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
    'gfield_contains_html',
    `gfield_visibility_${props.field.visibility || 'visible'}`
  ]

  if (props.field.cssClass) {
    classes.push(props.field.cssClass)
  }

  return classes.join(' ')
}
</script>
