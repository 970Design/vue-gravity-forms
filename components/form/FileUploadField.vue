<template>
  <div
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield gfield_contains_fileupload"
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

    <div class="ginput_container ginput_container_fileupload">
      <input
          :id="`input_${formId}_${field.id}`"
          type="file"
          :name="`input_${field.id}${isMultipleFiles ? '[]' : ''}`"
          :accept="getAcceptAttribute"
          :required="field.isRequired"
          :disabled="field.disabled"
          :multiple="isMultipleFiles"
          :class="getInputClasses()"
          :aria-label="shouldHideLabel ? field.label : null"
          :aria-describedby="getAriaDescribedBy()"
          :aria-invalid="hasError"
          @change="onFileChange"
          ref="fileInput"
      />

      <!-- Display selected files -->
      <div v-if="selectedFiles.length > 0" class="gfield_fileupload_files">
        <ul class="gfield_fileupload_list">
          <li v-for="(file, index) in selectedFiles" :key="index" class="gfield_fileupload_file">
            <span class="gfield_fileupload_filename">{{ file.name }}</span>
            <span class="gfield_fileupload_filesize">({{ formatFileSize(file.size) }})</span>
            <button
                v-if="isMultipleFiles"
                type="button"
                @click="removeFile(index)"
                class="gfield_fileupload_remove"
                :aria-label="`Remove ${file.name}`"
            >
              ×
            </button>
          </li>
        </ul>
      </div>

      <!-- Max files info -->
      <div v-if="isMultipleFiles && maxFiles" class="gfield_fileupload_rules">
        Maximum {{ maxFiles }} files allowed
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
import { computed, ref, watch } from 'vue'

const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: [File, Array, null],
    default: null,
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

const fileInput = ref(null);
const selectedFiles = ref([]);

// Check if multiple files are allowed
const isMultipleFiles = computed(() => {
  return props.field.multipleFiles === true || props.field.multipleFiles === 1;
});

// Get max files limit
const maxFiles = computed(() => {
  if (!isMultipleFiles.value) return 1;
  return props.field.maxFiles || null;
});

// Check if this is a complex field
const isComplexField = computed(() => {
  return ['fileupload', 'file_upload'].includes(props.field.type)
});

// Determine if label should be hidden (but still rendered)
const shouldHideLabel = computed(() => {
  if (props.field.labelPlacement === 'hidden_label') {
    return true;
  }
  if (props.field.visibility === 'hidden' || props.field.visibility === 'administrative') {
    return true;
  }
  return false;
});

// Get accept attribute for file input
const getAcceptAttribute = computed(() => {
  if (props.field.allowedExtensions) {
    const extensions = props.field.allowedExtensions.split(',').map(ext => '.' + ext.trim());
    return extensions.join(',');
  }
  return '';
});

// Initialize selectedFiles from modelValue
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    selectedFiles.value = [];
  } else if (Array.isArray(newValue)) {
    selectedFiles.value = newValue;
  } else {
    selectedFiles.value = [newValue];
  }
}, { immediate: true });

const onFileChange = (event) => {
  const files = Array.from(event.target.files || []);

  if (isMultipleFiles.value) {
    // Check max files limit
    if (maxFiles.value && files.length > maxFiles.value) {
      alert(`You can only upload a maximum of ${maxFiles.value} files.`);
      // Reset the input
      if (fileInput.value) {
        fileInput.value.value = '';
      }
      return;
    }

    selectedFiles.value = files;
    emit("update:modelValue", files.length > 0 ? files : null);
  } else {
    const file = files[0] || null;
    selectedFiles.value = file ? [file] : [];
    emit("update:modelValue", file);
  }
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);

  if (selectedFiles.value.length === 0) {
    emit("update:modelValue", null);
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } else {
    emit("update:modelValue", isMultipleFiles.value ? selectedFiles.value : selectedFiles.value[0]);
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const getFieldClasses = () => {
  const classes = [
    "gfield_contains_fileupload",
    `field_sublabel_${props.field.subLabelPlacement || "below"}`,
    `field_description_${props.field.descriptionPlacement || "below"}`,
    `gfield_visibility_${props.field.visibility || "visible"}`,
  ];

  if (props.field.labelPlacement) {
    classes.push(`field_${props.field.labelPlacement}`);
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

  if (isMultipleFiles.value) {
    classes.push("gfield_multiple_files");
  }

  return classes.join(" ");
};

const getInputClasses = () => {
  const classes = [props.field.size || "large"];
  if (props.hasError) {
    classes.push("gfield_error");
  }
  return classes.join(" ");
};

const getAriaDescribedBy = () => {
  const describedBy = [];

  if (props.field.description && props.field.descriptionPlacement !== 'hidden') {
    describedBy.push(`gfield_description_${props.formId}_${props.field.id}`);
  }

  if (props.hasError) {
    describedBy.push(`validation_message_${props.formId}_${props.field.id}`);
  }

  return describedBy.length > 0 ? describedBy.join(' ') : null;
};
</script>
