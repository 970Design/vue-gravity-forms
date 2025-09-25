<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield"
  >
    <label
        :for="`input_${formId}_${field.id}`"
        class="gfield_label"
        :class="{ 'gfield_label_before_complex': isComplexField }"
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

    <div class="ginput_container ginput_container_select">
      <select
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}[]`"
          multiple
          v-model="internalValue"
          :class="getSelectClasses()"
          :required="field.isRequired"
          :aria-required="field.isRequired"
          :aria-invalid="hasError"
          :aria-describedby="getAriaDescribedBy()"
          :aria-label="shouldHideLabel ? field.label : null"
          :disabled="field.disabled"
      >
        <option
            v-for="choice in field.choices"
            :key="choice.value"
            :value="choice.value"
            :disabled="choice.disabled"
        >
          {{ choice.text }}
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
import { computed, watchEffect } from "vue";

const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: Array,
    default: () => [],
  },
  formId: {
    type: [String, Number],
    required: true,
  },
  errorMessage: {
    type: String,
    default: "",
  },
  hasError: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

// Check if this is a complex field
const isComplexField = computed(() => {
  return ['multiselect', 'select'].includes(props.field.type)
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

const internalValue = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// Auto-select default values if modelValue is empty
watchEffect(() => {
  if (
      (!props.modelValue || props.modelValue.length === 0) &&
      props.field?.choices?.length
  ) {
    const selectedChoices = props.field.choices
        .filter((choice) => choice.isSelected)
        .map((choice) => choice.value);

    if (selectedChoices.length > 0) {
      emit("update:modelValue", selectedChoices);
    }
  }
});

const handleChange = (event) => {
  const selected = Array.from(event.target.selectedOptions).map(
      (option) => option.value
  );
  emit("update:modelValue", selected);
};

const getFieldClasses = () => {
  const classes = [
    "gfield_contains_select",
    `field_sublabel_${props.field.subLabelPlacement || "below"}`,
    `field_description_${props.field.descriptionPlacement || "below"}`,
    `gfield_visibility_${props.field.visibility || "visible"}`,
  ];

  // Add label placement class
  if (props.field.labelPlacement) {
    classes.push(`field_${props.field.labelPlacement}`)
  }

  if (props.field.isRequired) {
    classes.push("gfield_contains_required");
  }

  if (props.hasError) {
    classes.push("gfield_error");
  }

  if (props.field.size) {
    classes.push(`field_size_${props.field.size}`);
  }

  if (props.field.cssClass) {
    classes.push(props.field.cssClass);
  }

  if (props.field.enhancedUI) {
    classes.push("gfield_select_enhanced");
  }

  return classes.join(" ");
};

const getSelectClasses = () => {
  const classes = [props.field.size || "large"];

  if (props.hasError) {
    classes.push("gfield_error");
  }

  if (props.field.enhancedUI) {
    classes.push("enhanced");
  }

  return classes.join(" ");
};

const getAriaDescribedBy = () => {
  const describedBy = [];

  if (
      props.field.description &&
      props.field.descriptionPlacement !== "hidden"
  ) {
    describedBy.push(`gfield_description_${props.formId}_${props.field.id}`);
  }

  if (props.hasError) {
    describedBy.push(`validation_message_${props.formId}_${props.field.id}`);
  }

  return describedBy.length > 0 ? describedBy.join(" ") : null;
};</script>
