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

const props = defineProps([
  'endpoint',
  'formId',
  'wpAppPassword',
  'wpUsername',
  'recaptchaKey' // optional prop for reCAPTCHA site key
]);

let endpoint = props.endpoint;
const wpUsername = props.wpUsername;
const wpAppPassword = props.wpAppPassword;
const formId = props.formId;
const recaptchaKey = props.recaptchaKey; // optional reCAPTCHA key
const form = ref(null);
const formData = ref({});
const loading = ref(false);
const successMessage = ref("");
const errorMessage = ref("");
const fieldErrors = reactive({});
const showForm = ref(true); // Control form visibility for confirmations

// Multi-step functionality
const currentPage = ref(1);
const totalPages = ref(1);
const formPages = ref([]);

//validation and normalization of endpoint URL
if (endpoint) {
  try {
    const url = new URL(endpoint);
    endpoint = url.origin + url.pathname.replace(/\/+$/, ''); // Remove trailing slashes
  } catch (e) {
    console.error('Invalid endpoint URL:', endpoint);
    throw new Error('Invalid endpoint URL');
  }
} else {
  console.error('No endpoint provided');
  throw new Error('No endpoint provided');
}

//validate WP credentials
const validCredentialPattern = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~ ]+$/;
if (!wpUsername || !validCredentialPattern.test(wpUsername)) {
  console.error('Invalid or missing WP Username.');
  throw new Error('Invalid or missing WP Username.');
}
if (!wpAppPassword || !validCredentialPattern.test(wpAppPassword)) {
  console.error('Invalid or missing WP Application Password.');
  throw new Error('Invalid or missing WP Application Password.');
}

// Create proper Basic Auth headers
const getAuthHeaders = () => {
  const headers = {};

  if (wpUsername && wpAppPassword) {
    const authString = `${wpUsername}:${wpAppPassword}`;
    headers["Authorization"] = `Basic ${btoa(authString)}`;
  } else {
    console.warn('No authentication credentials found.');
    throw new Error('No authentication credentials found.');
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
      // If we have accumulated fields, create a page
      if (currentPageFields.length > 0) {
        pages.push({
          pageNumber: pages.length + 1,
          fields: currentPageFields,
          pageBreak: currentPageBreak
        });
        currentPageFields = [];
      }

      // Set the page break for the next page
      currentPageBreak = field;
    } else {
      currentPageFields.push(field);
    }
  });

  // Add remaining fields to the last page
  if (currentPageFields.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      fields: currentPageFields,
      pageBreak: currentPageBreak
    });
  }

  // If no pages were created (no fields), create a default empty page
  if (pages.length === 0) {
    pages.push({
      pageNumber: 1,
      fields: [],
      pageBreak: null
    });
  }

  return pages;
};

// Get current page fields
const currentPageFields = computed(() => {
  if (formPages.value.length === 0) return [];
  return formPages.value[currentPage.value - 1]?.fields || [];
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
    // On last page, use form submit button text or default to 'Submit'
    return form.value?.button?.text || 'Submit';
  }

  // For non-last pages, check if current page break has custom next button text
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

// Validate current page fields
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
        // Address fields
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
    // Submit the form
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

// Navigate to specific page (for progress indicator)
const goToPage = (pageNumber) => {
  if (pageNumber >= 1 && pageNumber <= totalPages.value) {
    // Only allow navigation to previous pages or current page
    // To go to future pages, validate all previous pages
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

// Fetch form schema
const fetchForm = async () => {
  try {
    const response = await fetch(`${endpoint}/wp-json/gf/v2/forms/${formId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
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
      if (field.type === 'page') return; // Skip page fields

      const fieldKey = `input_${field.id}`;

      if (isCheckboxFieldType(field.type) || isMultiselectFieldType(field.type)) {
        // Special handling for consent fields - they expect string values, not arrays
        if (field.type === 'consent') {
          initialData[fieldKey] = "";
        } else {
          initialData[fieldKey] = [];
        }
      } else if (isFileUploadFieldType(field.type)) {
        // Set file upload fields to null instead of empty string
        initialData[fieldKey] = null;
      } else if (isAddressFieldType(field.type)) {
        // Initialize address fields as objects
        initialData[fieldKey] = {};
      } else {
        initialData[fieldKey] = "";
      }

      // Handle "other" values for checkbox/radio fields
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
    // Fallback to default message
    successMessage.value = response.message || "Form submitted successfully!";
    showForm.value = false;
    return;
  }

  switch (confirmation.type) {
    case 'message':
      // Display custom message
      successMessage.value = confirmation.message || response.message || "Form submitted successfully!";
      showForm.value = false;
      break;

    case 'redirect':
    case 'page':
      // Redirect to specified URL
      if (confirmation.url) {
        setTimeout(() => {
          window.location.href = confirmation.url;
        }, 500);
      } else {
        // Fallback if no URL specified
        successMessage.value = response.message || "Form submitted successfully!";
        showForm.value = false;
      }
      break;

    default:
      // Default behavior
      successMessage.value = response.message || "Form submitted successfully!";
      showForm.value = false;
  }
};

// Reset form to initial state
const resetForm = () => {
  const resetData = {};
  form.value.fields.forEach(field => {
    if (field.type === 'page') return; // Skip page fields

    const fieldKey = `input_${field.id}`;

    if (isCheckboxFieldType(field.type) || isMultiselectFieldType(field.type)) {
      resetData[fieldKey] = [];
    } else if (isFileUploadFieldType(field.type)) {
      // Set file upload fields to null instead of empty string
      resetData[fieldKey] = null;
    } else if (isAddressFieldType(field.type)) {
      // Reset address fields as empty objects
      resetData[fieldKey] = {};
    } else {
      resetData[fieldKey] = "";
    }

    // Reset "other" values too
    if (field.enableOtherChoice) {
      resetData[`${fieldKey}_other`] = "";
    }
  });
  formData.value = resetData;

  // Reset file inputs manually (Vue doesn't reset file inputs automatically)
  form.value.fields.forEach(field => {
    if (isFileUploadFieldType(field.type)) {
      const fileInput = document.querySelector(`#input_${formId}_${field.id}`);
      if (fileInput) {
        fileInput.value = '';
      }
    }
  });

  // Reset to first page
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
      // If no field-specific errors but general error, scroll to form top
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

// Submit form (internal function)
const performFormSubmission = async () => {
  loading.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  Object.keys(fieldErrors).forEach(key => delete fieldErrors[key]);

  const fd = new FormData();

  // Handle form data submission
  Object.entries(formData.value).forEach(([fieldKey, fieldValue]) => {
    if (Array.isArray(fieldValue)) {
      const fieldId = fieldKey.replace('input_', '');

      // Find the corresponding field definition
      const field = form.value.fields.find(f => f.id == fieldId);

      if (field && isCheckboxFieldType(field.type)) {
        // Checkboxes must use indexed input_{id}_{n}
        fieldValue.forEach(selectedValue => {
          const choiceIndex = field.choices.findIndex(choice => choice.value === selectedValue);
          if (choiceIndex !== -1) {
            const indexedKey = `input_${fieldId}_${choiceIndex + 1}`;
            fd.append(indexedKey, selectedValue);
          }
        });
      } else if (field && isMultiselectFieldType(field.type)) {
        // Multi-select should just append array values as input_{id}[]
        fieldValue.forEach(selectedValue => {
          fd.append(`input_${fieldId}[]`, selectedValue);
        });
      }
    } else if (typeof fieldValue === 'object' && fieldValue !== null && !Array.isArray(fieldValue)) {
      // Handle address fields (objects)
      const fieldId = fieldKey.replace('input_', '');
      const field = form.value.fields.find(f => f.id == fieldId);

      if (field && isAddressFieldType(field.type)) {
        // Address fields use specific input IDs based on Gravity Forms structure
        // input_{fieldId}_1 = street, input_{fieldId}_2 = street2, etc.
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
      }
    } else if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
      // Handle regular fields including consent fields
      const fieldId = fieldKey.replace('input_', '');
      const field = form.value.fields.find(f => f.id == fieldId);

      if (field && field.type === 'consent') {
        // Consent fields use a specific format: input_{id}.1
        fd.append(`input_${fieldId}.1`, fieldValue);

        // Also send the consent text for entry display
        if (fieldValue === '1') {
          fd.append(`input_${fieldId}.2`, field.checkboxLabel || field.label || '');
        }
      } else {
        // Handle other regular fields (text, select, radio, etc.)
        fd.append(fieldKey, fieldValue);
      }
    }
  });

  // Handle "other" values for checkboxes and multi-selects
  Object.entries(formData.value).forEach(([fieldKey, fieldValue]) => {
    if (fieldKey.includes('_other') && fieldValue) {
      fd.append(fieldKey, fieldValue);
    }
  });

  try {
    const response = await fetch(`${endpoint}/wp-json/gf/v2/forms/${formId}/submissions`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: fd,
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    if (response.ok) {
      // Reset form first
      resetForm();

      // Handle confirmation based on form settings
      handleConfirmation(data);

    } else {
      // Handle field-specific validation errors
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
          <template v-for="field in currentPageFields" :key="field.id">

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
          </template>
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
