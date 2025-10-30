<script setup>
import { ref, reactive, onMounted, nextTick, computed } from "vue";
import { load } from 'recaptcha-v3';
import TextField from "./form/TextField.vue";
import TextareaField from "./form/TextareaField.vue";
import SelectField from "./form/SelectField.vue";
import MultiselectField from "./form/MultiselectField.vue";
import RadioField from "./form/RadioField.vue";
import CheckboxField from "./form/CheckboxField.vue";
import DateTimeField from "./form/DateTimeField.vue";
import HiddenField from "./form/HiddenField.vue";
import FileUploadField from "./form/FileUploadField.vue";
import SectionBreakField from "./form/SectionBreakField.vue";
import AddressField from "./form/AddressField.vue";
import ImageChoiceField from "./form/ImageChoiceField.vue";
import NameField from "./form/NameField.vue";

import { useFieldComponents } from './composables/useFieldComponents';
import { useConditionalLogic } from './composables/useConditionalLogic';

const props = defineProps({
  endpoint: {
    type: String,
    required: true
  },
  formId: {
    type: [String, Number],
    required: true
  },
  apiKey: {
    type: String,
    required: false
  },
  recaptchaKey: {
    type: String,
    required: false
  },
  customComponents: {
    type: Object,
    default: () => ({})
  }
});

let endpoint = props.endpoint;
const formId = props.formId;
const apiKey = props.apiKey;
const recaptchaKey = props.recaptchaKey;
const form = ref(null);
const formData = ref({});
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const fieldErrors = reactive({});
const showForm = ref(true);

const { fieldComponents } = useFieldComponents(props.customComponents);

// Multi-step functionality
const currentPage = ref(1);
const totalPages = ref(1);
const formPages = ref([]);

// All fields (for conditional logic evaluation)
const allFields = computed(() => form.value?.fields || []);

// Validation and normalization of endpoint URL
if (endpoint) {
  try {
    const url = new URL(endpoint);
    endpoint = url.origin;
  } catch (e) {
    console.error('Invalid endpoint URL:', endpoint);
    throw new Error('Invalid endpoint URL');
  }
} else {
  console.error('No endpoint provided');
  throw new Error('No endpoint provided');
}

// Create headers for API requests
const getApiHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };

  // Add API key if provided
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return headers;
};

// Get headers for form submission (multipart/form-data)
const getSubmissionHeaders = () => {
  const headers = {};

  // Add API key if provided (don't set Content-Type for FormData)
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  return headers;
};

// Organize fields into pages based on 'page' field type
const organizeFieldsIntoPages = (fields) => {
  const pages = [];
  let currentPageFields = [];
  let currentPageBreak = null;

  fields.forEach(field => {
    if (field.type === 'page') {
      if (currentPageFields.length > 0) {
        pages.push({
          pageNumber: pages.length + 1,
          fields: currentPageFields,
          pageBreak: currentPageBreak
        });
        currentPageFields = [];
      }
      currentPageBreak = field;
    } else {
      currentPageFields.push(field);
    }
  });

  if (currentPageFields.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      fields: currentPageFields,
      pageBreak: currentPageBreak
    });
  }

  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      fields: [],
      pageBreak: null
    });
  }

  return pages;
};

// Get current page fields (filtered by conditional logic visibility)
const currentPageFields = computed(() => {
  if (formPages.value.length === 0) return [];
  const pageFields = formPages.value[currentPage.value - 1]?.fields || [];

  // Filter fields based on conditional logic
  return pageFields.filter(field => {
    const { isFieldVisible } = useConditionalLogic(field, formData, allFields);
    return isFieldVisible.value;
  });
});

// Get current page break settings
const currentPageBreak = computed(() => {
  if (formPages.value.length === 0) return null;
  return formPages.value[currentPage.value - 1]?.pageBreak || null;
});

// Check if current page is the last page
const isLastPage = computed(() => {
  return currentPage.value === totalPages.value;
});

// Check if current page is the first page
const isFirstPage = computed(() => {
  return currentPage.value === 1;
});

// Get next button text
const nextButtonText = computed(() => {
  if (isLastPage.value) {
    return form.value?.button?.text || 'Submit';
  }

  const pageBreak = currentPageBreak.value;
  if (pageBreak?.nextButton?.text) {
    return pageBreak.nextButton.text;
  }

  return 'Next';
});

// Get previous button text
const previousButtonText = computed(() => {
  const pageBreak = currentPageBreak.value;
  if (pageBreak?.previousButton?.text) {
    return pageBreak.previousButton.text;
  }
  return 'Previous';
});

// Validate current page fields (only validate visible fields)
const validateCurrentPage = () => {
  const pageFields = currentPageFields.value;
  let isValid = true;

  // Clear previous page errors
  Object.keys(fieldErrors).forEach(key => {
    const fieldId = key.replace('input_', '');
    const field = pageFields.find(f => f.id == fieldId);
    if (field) {
      delete fieldErrors[key];
    }
  });

  pageFields.forEach(field => {
    const fieldKey = `input_${field.id}`;
    const fieldValue = formData.value[fieldKey];

    if (field.isRequired) {
      let isEmpty = false;

      if (Array.isArray(fieldValue)) {
        isEmpty = fieldValue.length === 0;
      } else if (typeof fieldValue === 'object' && fieldValue !== null) {
        isEmpty = Object.keys(fieldValue).length === 0 ||
            Object.values(fieldValue).every(val => !val);
      } else {
        isEmpty = !fieldValue || fieldValue.toString().trim() === '';
      }

      if (isEmpty) {
        fieldErrors[field.id] = `${field.label} is required.`;
        isValid = false;
      }
    }
  });

  return isValid;
};

// Navigate to next page
const nextPage = () => {
  if (isLastPage.value) {
    submitForm();
    return;
  }

  if (validateCurrentPage()) {
    currentPage.value++;
    scrollToFormTop();
  } else {
    scrollToFirstError();
  }
};

// Navigate to previous page
const previousPage = () => {
  if (!isFirstPage.value) {
    currentPage.value--;
    scrollToFormTop();
  }
};

// Navigate to specific page
const goToPage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    if (pageNumber <= currentPage.value) {
      currentPage.value = pageNumber;
      scrollToFormTop();
    }
  }
};

// Scroll to form top
const scrollToFormTop = () => {
  nextTick(() => {
    const formElement = document.querySelector(`#gform_${formId}`);
    if (formElement) {
      formElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
};

// Progress calculation
const progressPercentage = computed(() => {
  return Math.round((currentPage.value / totalPages.value) * 100);
});

// Fetch form schema using the new secure endpoint
const fetchForm = async () => {
  try {
    const response = await fetch(`${endpoint}/wp-json/gf-headless/v1/forms/${formId}`, {
      method: 'GET',
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = {message: errorText};
      }

      throw new Error(`HTTP ${response.status}: ${errorData.message || errorText}`);
    }

    const formResponse = await response.json();
    form.value = formResponse;

    // Organize fields into pages
    formPages.value = organizeFieldsIntoPages(form.value.fields);
    totalPages.value = formPages.value.length;

    // Initialize form data
    const initialData = {};
    form.value.fields.forEach(field => {
      if (field.type === 'page') return;

      const fieldKey = `input_${field.id}`;

      if (isCheckboxFieldType(field.type) || isMultiselectFieldType(field.type)) {
        if (field.type === 'consent') {
          initialData[fieldKey] = "";
        } else {
          initialData[fieldKey] = [];
        }
      } else if (isFileUploadFieldType(field.type)) {
        initialData[fieldKey] = null;
      } else if (isAddressFieldType(field.type)) {
        initialData[fieldKey] = {};
      } else if (isNameFieldType(field.type) && field.nameFormat !== 'simple') {
        // Initialize as object for complex name format, string for simple
        initialData[fieldKey] = {};
      } else {
        initialData[fieldKey] = "";
      }

      if (field.enableOtherChoice) {
        initialData[`${fieldKey}_other`] = "";
      }
    });
    formData.value = initialData;

  } catch (error) {
    console.error('Failed to load form:', error);
    errorMessage.value = `Failed to load form: ${error.message}`;
  }
};

// Handle different confirmation types
const handleConfirmation = (response) => {
  const confirmation = form.value.confirmations ? Object.values(form.value.confirmations)[0] : null;

  if (!confirmation) {
    successMessage.value = response.message || "Form submitted successfully!";
    showForm.value = false;
    return;
  }

  switch (confirmation.type) {
    case 'message':
      successMessage.value = confirmation.message || response.message || "Form submitted successfully!";
      showForm.value = false;
      break;

    case 'redirect':
    case 'page':
      if (confirmation.url) {
        setTimeout(() => {
          window.location.href = confirmation.url;
        }, 500);
      } else {
        successMessage.value = response.message || "Form submitted successfully!";
        showForm.value = false;
      }
      break;

    default:
      successMessage.value = response.message || "Form submitted successfully!";
      showForm.value = false;
  }
};

// Reset form to initial state
const resetForm = () => {
  const resetData = {};
  form.value.fields.forEach(field => {
    if (field.type === 'page') return;

    const fieldKey = `input_${field.id}`;

    if (isCheckboxFieldType(field.type) || isMultiselectFieldType(field.type)) {
      resetData[fieldKey] = [];
    } else if (isFileUploadFieldType(field.type)) {
      resetData[fieldKey] = null;
    } else if (isAddressFieldType(field.type)) {
      resetData[fieldKey] = {};
    } else if (isNameFieldType(field.type) && field.nameFormat !== 'simple') {
      resetData[fieldKey] = {};
    } else {
      resetData[fieldKey] = "";
    }

    if (field.enableOtherChoice) {
      resetData[`${fieldKey}_other`] = "";
    }
  });
  formData.value = resetData;

  // Reset file inputs manually
  form.value.fields.forEach(field => {
    if (isFileUploadFieldType(field.type)) {
      const fileInput = document.querySelector(`#input_${formId}_${field.id}`);
      if (fileInput) {
        fileInput.value = '';
      }
    }
  });

  currentPage.value = 1;
};

// Scroll to first error field
const scrollToFirstError = () => {
  nextTick(() => {
    const firstErrorFieldId = Object.keys(fieldErrors).find(key => fieldErrors[key]);

    if (firstErrorFieldId) {
      const fieldElement = document.querySelector(`#field_${formId}_${firstErrorFieldId}`);

      if (fieldElement) {
        fieldElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        const inputElement = fieldElement.querySelector('input, textarea, select');
        if (inputElement) {
          setTimeout(() => {
            inputElement.focus();
          }, 500);
        }
      }
    } else if (errorMessage.value) {
      const formElement = document.querySelector(`#gform_${formId}`);
      if (formElement) {
        formElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
  });
};

// Submit form using the new secure endpoint
const performFormSubmission = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  Object.keys(fieldErrors).forEach(key => delete fieldErrors[key]);

  const fd = new FormData();

  // Get all visible fields for submission (considering conditional logic)
  const visibleFields = form.value.fields.filter(field => {
    if (field.type === 'page') return false;
    const { isFieldVisible } = useConditionalLogic(field, formData, allFields);
    return isFieldVisible.value;
  });

  // Handle form data submission
  Object.entries(formData.value).forEach(([fieldKey, fieldValue]) => {
    const fieldId = fieldKey.replace('input_', '');
    const field = form.value.fields.find(f => f.id == fieldId);

    // Skip if field is not visible due to conditional logic
    if (field && !visibleFields.includes(field)) {
      return;
    }

    // Skip "other" fields in this loop (handle separately below)
    if (fieldKey.includes('_other')) {
      return;
    }

    // Handle file uploads FIRST
    if (field && isFileUploadFieldType(field.type)) {
      // Check if this is a multi-file upload field
      const isMultiFile = field.multipleFiles === true || field.multipleFiles === 1;

      if (isMultiFile) {
        // Multi-file upload - append with array notation
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          fieldValue.forEach((file, index) => {
            if (file instanceof File) {
              // Append each file with array index notation to mimic HTML file input behavior
              fd.append(`${fieldKey}[${index}]`, file, file.name);
            }
          });
        }
      } else {
        // Single file upload
        if (fieldValue && fieldValue instanceof File) {
          fd.append(fieldKey, fieldValue, fieldValue.name);
        }
      }
      return; // Skip other processing for file fields
    }

    // Handle arrays (checkboxes, multiselect)
    if (Array.isArray(fieldValue)) {
      if (field && isCheckboxFieldType(field.type)) {
        fieldValue.forEach(selectedValue => {
          const choiceIndex = field.choices.findIndex(choice => choice.value === selectedValue);
          if (choiceIndex !== -1) {
            const indexedKey = `input_${fieldId}_${choiceIndex + 1}`;
            fd.append(indexedKey, selectedValue);
          }
        });
      } else if (field && isMultiselectFieldType(field.type)) {
        fieldValue.forEach(selectedValue => {
          fd.append(`input_${fieldId}[]`, selectedValue);
        });
      }
    }
    // Handle address and name objects
    else if (typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue)) {
      if (field && isAddressFieldType(field.type)) {
        const addressMapping = {
          street: '1',
          street2: '2',
          city: '3',
          state: '4',
          zip: '5',
          country: '6'
        };

        Object.entries(fieldValue).forEach(([addressKey, addressValue]) => {
          if (addressValue && addressMapping[addressKey]) {
            fd.append(`input_${fieldId}_${addressMapping[addressKey]}`, addressValue);
          }
        });
      } else if (field && isNameFieldType(field.type)) {
        // Handle name format
        if (field.nameFormat === 'simple') {
          fd.append(fieldKey, fieldValue);
        } else {
          // Complex format: object with prefix, first, middle, last, suffix
          // Use underscore (_) to match Address field format
          const nameMapping = {
            prefix: '2',
            first: '3',
            middle: '4',
            last: '6',
            suffix: '8'
          };

          Object.entries(fieldValue).forEach(([nameKey, nameValue]) => {
            if (nameValue && nameMapping[nameKey]) {
              // Use underscore separator: input_10_3 (same as Address field)
              fd.append(`input_${fieldId}_${nameMapping[nameKey]}`, nameValue);
            }
          });
        }
      }
    }
    // Handle simple values (text, textarea, select, radio, etc.)
    else if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
      if (field && field.type === 'consent') {
        fd.append(`input_${fieldId}.1`, fieldValue);
        if (fieldValue === '1') {
          fd.append(`input_${fieldId}.2`, field.checkboxLabel || field.label || '');
        }
      } else {
        fd.append(fieldKey, fieldValue);
      }
    }
  });

  // Handle "other" values for checkboxes and multi-selects
  Object.entries(formData.value).forEach(([fieldKey, fieldValue]) => {
    if (fieldKey.includes('_other') && fieldValue) {
      const fieldId = fieldKey.replace('input_', '').replace('_other', '');
      const field = form.value.fields.find(f => f.id == fieldId);

      // Skip if field is not visible
      if (field && !visibleFields.includes(field)) {
        return;
      }

      fd.append(fieldKey, fieldValue);
    }
  });

  try {
    const response = await fetch(`${endpoint}/wp-json/gf-headless/v1/forms/${formId}/submit`, {
      method: "POST",
      headers: getSubmissionHeaders(),
      body: fd,
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text that failed to parse:', responseText);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (response.ok) {
      resetForm();
      handleConfirmation(data);
    } else {
      if (data.validation_messages) {
        Object.entries(data.validation_messages).forEach(([fieldId, message]) => {
          fieldErrors[fieldId] = message;
        });
      }
      errorMessage.value = data.message || data.error || `HTTP ${response.status}: ${responseText}`;
    }
  } catch (err) {
    console.error('Submission error:', err);
    errorMessage.value = `Submission failed: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Submit form with optional reCAPTCHA verification
const submitForm = async (event) => {
  if (event) {
    event.preventDefault();
  }

  // Final validation of all required fields
  if (!validateCurrentPage()) {
    scrollToFirstError();
    return;
  }

  // If reCAPTCHA key is provided, verify with reCAPTCHA first
  if (recaptchaKey) {
    try {
      const recaptcha = await load(recaptchaKey);
      const token = await recaptcha.execute('gravityform');

      if (token && (!event || event.isTrusted)) {
        await performFormSubmission();
      } else {
        errorMessage.value = 'reCAPTCHA verification failed. Please try again.';
        scrollToFirstError();
      }
    } catch (error) {
      console.error('reCAPTCHA error:', error);
      errorMessage.value = 'reCAPTCHA verification failed. Please try again.';
      scrollToFirstError();
    }
  } else {
    // No reCAPTCHA, submit directly
    await performFormSubmission();
  }
};

// Function to show form again (useful for message confirmations)
const showFormAgain = () => {
  showForm.value = true;
  successMessage.value = "";
  errorMessage.value = "";
  currentPage.value = 1;
};

// Helper functions to check if field type should use the specific component
const isTextFieldType = (fieldType) => {
  return ['text', 'email', 'number', 'phone', 'website', 'password'].includes(fieldType);
};

const isTextareaFieldType = (fieldType) => {
  return ['textarea', 'post_content'].includes(fieldType);
};

const isSelectFieldType = (fieldType) => {
  return ['select', 'post_category'].includes(fieldType);
};

const isMultiselectFieldType = (fieldType) => {
  return ['multiselect'].includes(fieldType);
};

const isRadioFieldType = (fieldType) => {
  return ['radio'].includes(fieldType);
};

const isCheckboxFieldType = (fieldType) => {
  return ['checkbox', 'multi_choice', 'consent'].includes(fieldType);
};

const isDateTimeFieldType = (fieldType) => {
  return ['date', 'time', 'datetime'].includes(fieldType);
};

const isHiddenFieldType = (fieldType) => {
  return ['hidden'].includes(fieldType);
};

const isFileUploadFieldType = (fieldType) => {
  return ['fileupload'].includes(fieldType);
};

const isSectionBreakFieldType = (fieldType) => {
  return ['section'].includes(fieldType);
};

const isAddressFieldType = (fieldType) => {
  return ['address'].includes(fieldType);
};

const isPageFieldType = (fieldType) => {
  return ['page'].includes(fieldType);
};

const isImageChoiceFieldType = (fieldType) => {
  return ['image_choice'].includes(fieldType);
};

const isNameFieldType = (fieldType) => {
  return ['name'].includes(fieldType);
};

onMounted(() => {
  if (!endpoint) {
    errorMessage.value = 'API endpoint not configured';
    return;
  }

  fetchForm();
});
</script>

<template>
  <div class="gravity-form" :class="`gform_wrapper gform_wrapper_${formId}`">
    <div v-if="form" :id="`gform_${formId}`" class="gform_anchor" tabindex="-1"></div>

    <!-- Multi-step Progress Indicator -->
    <div v-if="form && showForm && totalPages > 1" class="gform_progress_wrapper">
      <div class="gform_progress_bar">
        <div class="gform_progress_fill" :style="{ width: progressPercentage + '%' }"></div>
      </div>
      <div class="gform_progress_steps">
        <button
            v-for="page in totalPages"
            :key="page"
            type="button"
            @click="goToPage(page)"
            class="gform_progress_step"
            :class="{
              'current': page === currentPage,
              'completed': page < currentPage,
              'accessible': page <= currentPage
            }"
            :disabled="page > currentPage"
        >
          {{ page }}
        </button>
      </div>
      <div class="gform_progress_text">
        Step {{ currentPage }} of {{ totalPages }}
      </div>
    </div>

    <!-- Show form when showForm is true -->
    <form
        v-if="form && showForm"
        :id="`gform_${formId}`"
        class="gform_legacy_markup"
        @submit="submitForm"
        method="post"
        enctype="multipart/form-data"
    >
      <div class="gform_heading">
        <h2 class="gform_title">{{ form.title }}</h2>
        <p v-if="form.description" class="gform_description">{{ form.description }}</p>
      </div>

      <div class="gform_body">
        <!-- Current Page Title and Description -->
        <div v-if="totalPages > 1" class="gform_page_header">
          <div v-if="currentPageBreak && currentPageBreak.label" class="gform_page_title_wrapper">
            <h3 class="gform_page_title">{{ currentPageBreak.label }}</h3>
          </div>

          <div
              v-if="currentPageBreak && currentPageBreak.description"
              class="gform_page_description"
              v-html="currentPageBreak.description"
          >
          </div>
        </div>

        <div :id="`gform_fields_${formId}`" class="gform_fields top_label form_sublabel_below description_below">
          <component
              v-for="field in currentPageFields"
              :key="field.id"
              :is="fieldComponents[field.type]"
              :field="field"
              :form-id="formId"
              v-model="formData[`input_${field.id}`]"
              :error-message="fieldErrors[field.id]"
              :has-error="!!fieldErrors[field.id]">

            <!-- Text Field Component -->
            <TextField
                v-if="isTextFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Address Field Component -->
            <AddressField
                v-else-if="isAddressFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Textarea Field Component -->
            <TextareaField
                v-else-if="isTextareaFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Select Field Component -->
            <SelectField
                v-else-if="isSelectFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Multi-Select Field Component -->
            <MultiselectField
                v-else-if="isMultiselectFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Radio Field Component -->
            <RadioField
                v-else-if="isRadioFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :other-value="formData[`input_${field.id}_other`] || ''"
                @update:other-value="formData[`input_${field.id}_other`] = $event"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Checkbox Field Component -->
            <CheckboxField
                v-else-if="isCheckboxFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :other-value="formData[`input_${field.id}_other`] || ''"
                @update:other-value="formData[`input_${field.id}_other`] = $event"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- DateTime Field Component -->
            <DateTimeField
                v-else-if="isDateTimeFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Hidden Field Component -->
            <HiddenField
                v-else-if="isHiddenFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- File Upload Field -->
            <FileUploadField
                v-else-if="isFileUploadFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Section Break Field -->
            <SectionBreakField
                v-else-if="isSectionBreakFieldType(field.type)"
                :field="field"
                :form-id="formId"
            />

            <!-- Image Choice Field Component -->
            <ImageChoiceField
                v-else-if="isImageChoiceFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :other-value="formData[`input_${field.id}_other`] || ''"
                @update:other-value="formData[`input_${field.id}_other`] = $event"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Name Field Component -->
            <NameField
                v-else-if="isNameFieldType(field.type)"
                :field="field"
                :form-id="formId"
                v-model="formData[`input_${field.id}`]"
                :error-message="fieldErrors[field.id]"
                :has-error="!!fieldErrors[field.id]"
            />

            <!-- Other field types - fallback with helpful message -->
            <div
                v-else-if="!isPageFieldType(field.type)"
                :id="`field_${formId}_${field.id}`"
                class="gfield"
                :class="{
                'gfield_error': fieldErrors[field.id],
                'gfield_contains_required': field.isRequired,
                [`gfield_contains_${field.type}`]: true
              }"
            >
              <label :for="`input_${formId}_${field.id}`" class="gfield_label">
                {{ field.label }}
                <span v-if="field.isRequired" class="gfield_required">
                  <span class="gfield_required_asterisk">*</span>
                </span>
              </label>
              <div class="ginput_container" :class="`ginput_container_${field.type}`">
                <div class="unsupported-field">
                  <strong>Field type "{{ field.type }}" is not yet supported.</strong>
                  <small>Please create a component for this field type or implement it inline.</small>
                  <details style="margin-top: 8px;">
                    <summary>Field data (for development)</summary>
                    <pre>{{ JSON.stringify(field, null, 2) }}</pre>
                  </details>
                </div>
              </div>
              <div v-if="fieldErrors[field.id]" class="gfield_validation_message">
                {{ fieldErrors[field.id] }}
              </div>
            </div>
          </component>
        </div>
      </div>

      <div class="gform_footer top_label">
        <div class="gform_page_footer">
          <!-- Previous Button -->
          <button
              v-if="totalPages > 1 && !isFirstPage"
              type="button"
              @click="previousPage"
              :id="`gform_previous_button_${formId}`"
              class="gform_previous_button gform_button button"
              :disabled="loading"
          >
            {{ previousButtonText }}
          </button>

          <!-- Next/Submit Button -->
          <button
              v-if="isLastPage"
              type="submit"
              @click="submitForm"
              :id="`gform_submit_button_${formId}`"
              class="gform_submit_button gform_button button"
              :disabled="loading"
          >
            {{ loading ? 'Submitting...' : nextButtonText }}
          </button>

          <button
              v-else
              type="button"
              @click="nextPage"
              :id="`gform_next_button_${formId}`"
              class="gform_next_button gform_button button"
              :disabled="loading"
          >
            {{ nextButtonText }}
          </button>
        </div>

        <input type="hidden" :value="formId" name="gform_submit" />
        <input type="hidden" :value="formId" :name="'is_submit_'+formId" />
      </div>
    </form>

    <!-- Success/Confirmation Message -->
    <div v-if="successMessage" class="gform_confirmation_wrapper">
      <div :id="`gform_confirmation_message_${formId}`" class="gform_confirmation_message" v-html="successMessage">
      </div>
      <!-- Add a button to submit another response -->
      <div class="gform_confirmation_actions">
        <button
            type="button"
            @click="showFormAgain"
            class="gform_button button"
        >
          Submit Another Response
        </button>
      </div>
    </div>

    <!-- Error Messages -->
    <div v-if="errorMessage && !Object.keys(fieldErrors).length" class="gform_validation_errors">
      <h2 class="gform_submission_error hide_summary">There was a problem with your submission.</h2>
      <div class="gform_submission_error">{{ errorMessage }}</div>
    </div>
  </div>
</template>


<style>
/* Variables */
:root {
  --gf-primary-color: #204ce5;
  --gf-error-color: #dc3545;
  --gf-success-color: #d4edda;
  --gf-border-color: #ddd;
  --gf-background-color: #fff;
  --gf-disabled-color: #999;
}

/* Base Form Styles */
.gravity-form {
  font-family: inherit;
}

.gform_wrapper {
  max-width: 600px;
  margin: 0 auto;
}

.gform_heading {
  margin-bottom: 1rem;
}

.gform_heading .gform_title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.gform_heading .gform_description {
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.gform_body {
  margin-bottom: 1rem;
}

.gform_body .gform_fields {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Button Styles */
.gform_footer,
.gform_confirmation_actions {
  text-align: center;
  margin-top: 1.25rem;
}

.gform_footer .gform_button,
.gform_confirmation_actions .gform_button {
  background: var(--gf-primary-color);
  color: var(--gf-background-color);
  border: 1px solid var(--gf-primary-color);
  border-radius: 3px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gform_footer .gform_button:hover:not(:disabled),
.gform_confirmation_actions .gform_button:hover:not(:disabled) {
  opacity: 0.9;
}

.gform_footer .gform_button:disabled,
.gform_confirmation_actions .gform_button:disabled {
  background: var(--gf-disabled-color);
  border-color: var(--gf-disabled-color);
  cursor: not-allowed;
}

/* Messages */
.gform_confirmation_wrapper {
  background: var(--gf-background-color);
  border: 1px solid var(--gf-background-color);
  padding: 1rem;
  border-radius: 3px;
  margin-bottom: 1rem;
}

.gform_confirmation_message {
  padding: 20px;
  background-color: var(--gf-success-color);
}

.gform_validation_errors {
  background: var(--gf-background-color);
  border: 1px solid var(--gf-error-color);
  color: var(--gf-error-color);
  padding: 1rem;
  border-radius: 3px;
  margin-bottom: 1rem;
}

.gform_validation_errors .gform_submission_error {
  font-weight: 600;
}

.hide_summary {
  display: none;
}

/* Field Styles */
.gfield {
  margin: 0 0 1rem 0;
  padding: 0;
  list-style-type: none;
  clear: both;
}

.gfield .gfield_label {
  display: block;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  cursor: pointer;
}

/* Hidden Label Styles */
.field_hidden_label > .gfield_label,
.field_hidden_label > legend.gfield_label {
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.field_hidden_label > .ginput_container {
  margin-top: 0;
}

/* Consent Field Special Handling */
.field_hidden_label.gfield_contains_consent .gfield_consent_description {
  position: static;
  left: auto;
  top: auto;
  width: auto;
  height: auto;
  overflow: visible;
  display: block;
}

/* Required Field Indicators */
.gfield_required {
  color: var(--gf-error-color);
}

.gfield_required_asterisk {
  color: var(--gf-error-color);
  margin-left: 0.25rem;
}

/* Input Container Spacing */
.ginput_container {
  margin-top: 0.25rem;
}

/* Validation Message */
.gfield_validation_message {
  color: var(--gf-error-color);
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.25rem;
  line-height: 1.3;
}

/* Field Description */
.gfield_description {
  font-size: 0.875rem;
  line-height: 1.3;
  margin-top: 0.25rem;
}

.gfield_description_above_input {
  margin-bottom: 0.25rem;
  margin-top: 0;
}

/* Error States */
.gfield_error .gfield_label {
  color: var(--gf-error-color);
}

.gfield_error input,
.gfield_error textarea,
.gfield_error select {
  border-color: var(--gf-error-color);
}

.gfield_error input:focus,
.gfield_error textarea:focus,
.gfield_error select:focus {
  border-color: var(--gf-error-color);
  box-shadow: 0 0 0 1px var(--gf-error-color);
}

/* Hidden Fields */
.gfield_visibility_hidden,
.gfield_visibility_administrative {
  display: none;
}

/* Section Break */
.gsection {
  margin: 30px 0;
  padding: 0;
  border: none;
}

/* Base Input Styles */
.ginput_container input[type="text"],
.ginput_container input[type="email"],
.ginput_container input[type="tel"],
.ginput_container input[type="url"],
.ginput_container input[type="password"],
.ginput_container input[type="number"],
.ginput_container input[type="date"],
.ginput_container input[type="time"],
.ginput_container textarea,
.ginput_container select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gf-border-color);
  border-radius: 3px;
  background-color: var(--gf-background-color);
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.ginput_container input:focus,
.ginput_container textarea:focus,
.ginput_container select:focus {
  border-color: var(--gf-primary-color);
  outline: none;
  box-shadow: 0 0 0 1px var(--gf-primary-color);
}

.ginput_container input:disabled,
.ginput_container textarea:disabled,
.ginput_container select:disabled {
  background-color: var(--gf-background-color);
  color: var(--gf-disabled-color);
  cursor: not-allowed;
}

/* Address Field */
.ginput_container_address {
  display: grid;
  grid-template-columns: 100%;
  gap: 0.75rem 1.5rem;
}

@media (min-width: 768px) {
  .ginput_container_address {
    grid-template-columns: 1fr 1fr;
  }
}

/* Name Field */
.gfield_contains_name .name_complex {
  display: grid;
  grid-template-columns: 100%;
  gap: 0.75rem 1.5rem;
}

@media (min-width: 768px) {
  .gfield_contains_name .name_complex {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 768px) {
  .gfield_contains_name .name_complex:has(.name_prefix) {
    grid-template-columns: 6.25rem 1fr 1fr;
  }
}

/* Textarea Specific Styles */
.ginput_container_textarea textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.4;
}

.ginput_container_textarea textarea::placeholder {
  opacity: 0.6;
}

@media (max-width: 767px) {
  .ginput_container_textarea textarea {
    min-height: 100px;
  }
}

/* Character Counter */
.ginput_counter {
  font-size: 0.75rem;
  text-align: right;
  margin-top: 0.25rem;
  opacity: 0.6;
}

.ginput_counter.over_limit {
  color: var(--gf-error-color);
  opacity: 1;
}

/* Select Field Specific Styles */
.ginput_container_select select {
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  appearance: none;
  padding-right: 2.5rem;
}

.ginput_container_select select[multiple] {
  background-image: none;
  padding-right: 0.75rem;
  min-height: 120px;
}

.ginput_container_select optgroup {
  font-weight: 600;
}

.ginput_container_select optgroup option {
  font-weight: normal;
  padding-left: 1rem;
}

/* Progress Bar */
.gf-progress {
  margin: 20px 0;
  padding: 10px;
  background: var(--gf-background-color);
  border-radius: 4px;
}

.gf-progress-bar {
  width: 100%;
  height: 8px;
  background: var(--gf-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.gf-progress-bar-fill {
  height: 100%;
  background: var(--gf-primary-color);
  transition: width 0.3s ease;
}

.gf-progress-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.gf-progress-step {
  position: relative;
  flex: 1;
  text-align: center;
  padding: 10px;
  font-size: 14px;
  color: var(--gf-disabled-color);
}

.gf-progress-step.active {
  color: var(--gf-primary-color);
  font-weight: 600;
}

.gf-progress-step.completed {
  color: var(--gf-success-color);
}

/* File Upload */
.ginput_container_fileupload {
  position: relative;
}

.gform_drop_area {
  border: 2px dashed var(--gf-border-color);
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  background: var(--gf-background-color);
}

.gform_drop_area.dragover {
  border-color: var(--gf-primary-color);
  background: rgba(32, 76, 229, 0.05);
}

.gform_drop_instructions {
  margin-bottom: 10px;
  color: var(--gf-disabled-color);
}

.gform_drop_area input[type="file"] {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.gform_fileupload_rules {
  margin-top: 8px;
  font-size: 12px;
  color: var(--gf-disabled-color);
}

.gform_delete_file {
  color: var(--gf-error-color);
  cursor: pointer;
  margin-left: 8px;
}

/* Preview Area */
.gform_preview_area {
  margin-top: 15px;
}

.gform_preview_file {
  display: flex;
  align-items: center;
  padding: 8px;
  background: var(--gf-background-color);
  border: 1px solid var(--gf-border-color);
  border-radius: 4px;
  margin-bottom: 8px;
}

.gform_preview_filename {
  flex: 1;
  margin-right: 10px;
}

.gform_preview_progress {
  width: 100px;
  height: 4px;
  background: var(--gf-border-color);
  border-radius: 2px;
  overflow: hidden;
}

.gform_preview_progress-bar {
  height: 100%;
  background: var(--gf-primary-color);
  transition: width 0.3s ease;
}

/* Multi-page Navigation */
.gform_page_footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--gf-border-color);
}

.gform_previous_button,
.gform_next_button {
  background: var(--gf-primary-color);
  color: var(--gf-background-color);
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.gform_previous_button:hover,
.gform_next_button:hover {
  opacity: 0.9;
}

.gform_previous_button {
  background: var(--gf-border-color);
}

/* Responsive Design */
@media (max-width: 768px) {
  .gf-progress-steps {
    display: none;
  }

  .gform_page_footer {
    flex-direction: column;
    gap: 10px;
  }

  .gform_previous_button,
  .gform_next_button {
    width: 100%;
  }

  .gform_drop_area {
    padding: 15px;
  }

  .gform_preview_file {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .gform_preview_progress {
    width: 100%;
  }
}
</style>
