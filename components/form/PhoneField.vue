<template>
  <component
      :is="isFormatted ? 'fieldset' : 'div'"
      :id="`field_${formId}_${field.id}`"
      :class="getFieldClasses()"
      class="gfield"
  >
    <component
        :is="isFormatted ? 'legend' : 'label'"
        :for="isFormatted ? undefined : `input_${formId}_${field.id}`"
        class="gfield_label"
    >
      {{ field.label }}
      <span v-if="field.isRequired" class="gfield_required">
        <span class="gfield_required_asterisk">*</span>
      </span>
    </component>

    <div
        v-if="field.description && field.descriptionPlacement === 'above'"
        class="gfield_description gfield_description_above_input"
        :id="`gfield_description_${formId}_${field.id}`"
    >
      {{ field.description }}
    </div>

    <!-- Standard / international (unformatted): plain tel input, unchanged from pre-3.0 behavior -->
    <div v-if="!isFormatted" class="ginput_container ginput_container_phone">
      <input
          :id="`input_${formId}_${field.id}`"
          :name="`input_${field.id}`"
          type="tel"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          :class="getInputClasses()"
          :placeholder="field.placeholder || ''"
          :required="field.isRequired"
          :maxlength="field.maxLength || null"
          :aria-required="field.isRequired"
          :aria-invalid="isFieldInvalid"
          :aria-describedby="getAriaDescribedBy()"
          :aria-label="shouldHideLabel ? field.label : null"
          :disabled="field.disabled"
      />
    </div>

    <!-- International (formatted): country selector + live-formatted number input -->
    <div v-else class="ginput_container ginput_container_phone">
      <div
          ref="containerRef"
          class="gform-phone"
          :class="{
            'gform-phone--show-dial-code': showCountryCode,
            'gform-phone--loading': !isLibraryReady
          }"
          role="application"
      >
        <div class="gform-phone__input-wrapper">
          <span class="ginput_country-selector_container">
            <label
                v-if="isSubLabelAbove"
                :for="countryButtonId"
                class="gform-field-label gform-field-label--type-sub"
            >{{ countrySublabelText }}</label>

            <button
                type="button"
                :id="countryButtonId"
                class="gform-phone__country-selector"
                aria-haspopup="listbox"
                :aria-expanded="isOpen"
                :aria-controls="dropdownId"
                aria-label="Select country"
                :aria-busy="!isLibraryReady"
                :disabled="field.disabled || !isLibraryReady"
                @click="toggleDropdown"
            >
              <span class="gform-phone__flag-icon" :class="`gform-phone__flag-icon--${selectedCountry.toLowerCase()}`">{{ flagEmoji(selectedCountry) }}</span>
              <span v-if="showCountryCode" class="gform-phone__dial-code">{{ dialCodeDisplay }}</span>
            </button>

            <label
                v-if="!isSubLabelAbove"
                :for="countryButtonId"
                class="gform-field-label gform-field-label--type-sub"
            >{{ countrySublabelText }}</label>
          </span>

          <span class="ginput_phone_container">
            <label
                v-if="isSubLabelAbove"
                :for="phoneInputId"
                class="gform-field-label gform-field-label--type-sub"
            >{{ phoneSublabelText }}</label>

            <input
                :id="phoneInputId"
                ref="phoneInputRef"
                type="tel"
                class="gform-phone__input"
                autocomplete="tel"
                :value="nationalInput"
                @input="handlePhoneInput"
                @blur="handlePhoneBlur"
                :placeholder="field.placeholder || ''"
                :required="field.isRequired"
                :aria-required="field.isRequired"
                :aria-invalid="isFieldInvalid"
                :aria-describedby="getAriaDescribedBy()"
                :aria-busy="!isLibraryReady"
                :disabled="field.disabled || !isLibraryReady"
            />

            <label
                v-if="!isSubLabelAbove"
                :for="phoneInputId"
                class="gform-field-label gform-field-label--type-sub"
            >{{ phoneSublabelText }}</label>
          </span>
        </div>

        <!-- Sibling of .gform-phone__input-wrapper (not nested in the country-selector span),
             matching GF core's own DOM, so it can be positioned relative to the full box width. -->
        <div
            v-if="isOpen"
            class="gform-phone__dropdown"
            role="listbox"
            :id="dropdownId"
            :aria-label="countrySublabelText"
        >
          <div class="gform-phone__search-wrapper">
            <input
                ref="searchInputRef"
                type="text"
                class="gform-phone__search"
                v-model="searchQuery"
                placeholder="Search countries"
                aria-label="Search for a country"
                @keydown.esc="closeDropdown(true)"
            />
          </div>

          <ul class="gform-phone__country-list gform-ul-reset">
            <li
                v-for="country in filteredCountries"
                :key="country.iso2"
                role="option"
                :aria-selected="country.iso2 === selectedCountry"
            >
              <button type="button" @click="selectCountry(country.iso2)">
                <span class="gform-phone__flag-icon" :class="`gform-phone__flag-icon--${country.iso2.toLowerCase()}`">{{ flagEmoji(country.iso2) }}</span>
                <span class="gform-phone__country-name">{{ country.name }}</span>
                <span class="gform-phone__dial-code">+{{ country.dialCode }}</span>
              </button>
            </li>
            <li v-if="!filteredCountries.length" class="gform-phone__no-results">No countries found</li>
          </ul>

          <div class="gform-phone__aria-live-search-status" aria-live="polite" aria-atomic="true">
            {{ filteredCountries.length }} countries found
          </div>
        </div>

        <div class="gform-phone__aria-live" aria-live="polite" aria-atomic="true"></div>
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
        v-if="displayErrorMessage"
        class="gfield_validation_message"
        :id="`validation_message_${formId}_${field.id}`"
    >
      {{ displayErrorMessage }}
    </div>
  </component>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { getGridColumnClass } from '../composables/useGridClass'

// Lazy-loaded so sites without a formatted phone field never pay for this
// dependency's metadata. Only awaited once, on mount, for formatted fields.
let phoneLibPromise = null
const loadPhoneLib = () => {
  if (!phoneLibPromise) {
    phoneLibPromise = import('libphonenumber-js/min')
  }
  return phoneLibPromise
}

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

// GF 3.0 defaults an unset phoneFormat to 'formatted' server-side (GF_Field_Phone::sanitize_settings()).
const phoneFormat = computed(() => props.field.phoneFormat || 'formatted')
const isFormatted = computed(() => phoneFormat.value === 'formatted')

const showCountryCode = computed(() => props.field.showCountryCode !== false)
const countrySublabelText = computed(() => props.field.countrySublabel || 'Country')
const phoneSublabelText = computed(() => props.field.phoneSublabel || 'Phone Number')
const isSubLabelAbove = computed(() => props.field.subLabelPlacement === 'above')

const phoneInputId = computed(() => `input_${props.formId}_${props.field.id}`)
const countryButtonId = computed(() => `country_selector_button_${props.formId}_${props.field.id}`)
const dropdownId = computed(() => `gform_phone_dropdown_${props.formId}_${props.field.id}`)

const shouldHideLabel = computed(() => {
  if (props.field.labelPlacement === 'hidden_label') {
    return true
  }

  if (props.field.visibility === 'hidden' || props.field.visibility === 'administrative') {
    return true
  }

  return false
})

// --- Formatted (international) UI state ---

const defaultCountry = computed(() => (props.field.defaultCountry || 'US').toUpperCase())

const selectedCountry = ref(defaultCountry.value)
const nationalInput = ref('')
const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref(null)
const searchInputRef = ref(null)
const phoneInputRef = ref(null)

const isLibraryReady = ref(false)
let phoneLib = null

let lastEmittedValue = ''

// Only surfaced on blur (not on every keystroke, which would flash an error
// while the user is still mid-typing a valid number) — otherwise an
// incomplete/invalid number is silently omitted from submission with no
// indication why, since it's indistinguishable from an empty optional field.
const showInvalidState = ref(false)

const isFieldInvalid = computed(() => props.hasError || (isFormatted.value && showInvalidState.value))

const displayErrorMessage = computed(() => {
  if (props.hasError && props.errorMessage) return props.errorMessage
  if (isFormatted.value && showInvalidState.value) return 'Please enter a valid phone number.'
  return ''
})

const parseStoredValue = (value) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && parsed.country && parsed.national) {
      return parsed
    }
  } catch (e) {
    // Not JSON (or not our formatted-phone shape) — treat as empty.
  }
  return null
}

const seedFromValue = (value) => {
  const parsed = parseStoredValue(value)
  selectedCountry.value = parsed ? parsed.country : defaultCountry.value
  nationalInput.value = parsed ? parsed.national : ''
}

seedFromValue(props.modelValue)

// Only re-seed on modelValue changes we didn't emit ourselves (e.g. fieldValues prefill),
// so local in-progress typing is never clobbered by our own round-tripped emission.
watch(() => props.modelValue, (newValue) => {
  if (newValue !== lastEmittedValue) {
    seedFromValue(newValue)
  }
})

const emitValue = (value) => {
  lastEmittedValue = value
  emit('update:modelValue', value)
}

const updateModelValue = () => {
  if (!phoneLib || !nationalInput.value) {
    emitValue('')
    return
  }

  try {
    const phoneNumber = phoneLib.parsePhoneNumberFromString(nationalInput.value, selectedCountry.value)
    if (phoneNumber && phoneNumber.isValid()) {
      // A +-prefixed number carries its own country, which can differ from the
      // selector (e.g. +44 pasted while the chip shows US). Trust the parsed
      // country and sync the selector to it, like GF core's own widget.
      const country = phoneNumber.country || selectedCountry.value
      if (country !== selectedCountry.value) {
        selectedCountry.value = country
      }
      emitValue(JSON.stringify({
        country,
        national: phoneNumber.formatNational(),
        formatted: phoneNumber.formatInternational(),
        e164: phoneNumber.format('E.164')
      }))
      return
    }
  } catch (e) {
    // Unparseable for the selected country — treat as incomplete/invalid.
  }

  emitValue('')
}

const handlePhoneInput = (event) => {
  if (!phoneLib) return
  showInvalidState.value = false
  nationalInput.value = new phoneLib.AsYouType(selectedCountry.value).input(event.target.value)
  updateModelValue()
}

const handlePhoneBlur = () => {
  showInvalidState.value = !!nationalInput.value && !lastEmittedValue
}

const openDropdown = () => {
  isOpen.value = true
  searchQuery.value = ''
  nextTick(() => searchInputRef.value?.focus())
}

const closeDropdown = (refocusTrigger = false) => {
  isOpen.value = false
  if (refocusTrigger) {
    nextTick(() => document.getElementById(countryButtonId.value)?.focus())
  }
}

const toggleDropdown = () => {
  if (isOpen.value) {
    closeDropdown()
  } else {
    openDropdown()
  }
}

const selectCountry = (iso2) => {
  selectedCountry.value = iso2
  showInvalidState.value = false
  closeDropdown()

  if (phoneLib && nationalInput.value) {
    nationalInput.value = new phoneLib.AsYouType(iso2).input(nationalInput.value)
  }

  updateModelValue()
  nextTick(() => phoneInputRef.value?.focus())
}

const handleClickOutside = (event) => {
  if (isOpen.value && containerRef.value && !containerRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)

  if (isFormatted.value) {
    loadPhoneLib().then((module) => {
      phoneLib = module
      isLibraryReady.value = true
    })
  }
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

// --- Country list ---

let regionDisplayNames = null
try {
  regionDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' })
} catch (e) {
  regionDisplayNames = null
}

const countryName = (iso2) => {
  try {
    return regionDisplayNames?.of(iso2) || iso2
  } catch (e) {
    return iso2
  }
}

const allCountries = computed(() => {
  if (!isLibraryReady.value || !phoneLib) return []

  return phoneLib.getCountries()
      .map((iso2) => ({
        iso2,
        name: countryName(iso2),
        dialCode: phoneLib.getCountryCallingCode(iso2)
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
})

const filteredCountries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return allCountries.value

  return allCountries.value.filter((country) =>
      country.name.toLowerCase().includes(query) ||
      country.iso2.toLowerCase().includes(query) ||
      country.dialCode.includes(query)
  )
})

const selectedCountryData = computed(() =>
    allCountries.value.find((country) => country.iso2 === selectedCountry.value)
)

const dialCodeDisplay = computed(() =>
    selectedCountryData.value ? `+${selectedCountryData.value.dialCode}` : ''
)

const flagEmoji = (iso2) => {
  if (!iso2 || iso2.length !== 2) return ''
  return iso2
      .toUpperCase()
      .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
}

// --- Shared classes/attributes (both formats) ---

const getFieldClasses = () => {
  const classes = [
    'gfield_contains_phone',
    `gfield--phone-format-${phoneFormat.value}`,
    `field_sublabel_${props.field.subLabelPlacement || 'below'}`,
    `field_description_${props.field.descriptionPlacement || 'below'}`,
    `gfield_visibility_${props.field.visibility || 'visible'}`
  ]

  if (props.field.labelPlacement) {
    classes.push(props.field.labelPlacement)
  }

  if (props.field.isRequired) {
    classes.push('gfield_contains_required')
  }

  if (isFieldInvalid.value) {
    classes.push('gfield_error')
  }

  if (props.field.size) {
    classes.push(`field_size_${props.field.size}`)
  }

  if (props.field.cssClass) {
    classes.push(props.field.cssClass)
  }

  const gridClass = getGridColumnClass(props.field)
  if (gridClass) {
    classes.push(gridClass)
  }

  return classes.join(' ')
}

const getInputClasses = () => {
  const classes = [props.field.size || 'large']

  if (props.hasError) {
    classes.push('gfield_error')
  }

  return classes.join(' ')
}

const getAriaDescribedBy = () => {
  const describedBy = []

  if (props.field.description && props.field.descriptionPlacement !== 'hidden') {
    describedBy.push(`gfield_description_${props.formId}_${props.field.id}`)
  }

  if (displayErrorMessage.value) {
    describedBy.push(`validation_message_${props.formId}_${props.field.id}`)
  }

  return describedBy.length > 0 ? describedBy.join(' ') : null
}
</script>
