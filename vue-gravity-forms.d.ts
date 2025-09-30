declare module '@970design/vue-gravity-forms' {
    import { DefineComponent } from 'vue'

    // Form field types
    type GravityFormFieldType =
        | 'text' | 'email' | 'number' | 'phone' | 'website' | 'password'
        | 'textarea' | 'post_content'
        | 'select' | 'post_category'
        | 'multiselect'
        | 'radio'
        | 'checkbox' | 'multi_choice' | 'consent'
        | 'date' | 'time' | 'datetime'
        | 'hidden'
        | 'fileupload'
        | 'section'
        | 'page'
        | 'address'
        | 'image_choice'

    // Field choice type
    interface GravityFormFieldChoice {
        text: string
        value: string
        isSelected?: boolean
    }

    // Field base interface
    interface GravityFormField {
        id: string | number
        type: GravityFormFieldType
        label: string
        description?: string
        isRequired?: boolean
        choices?: GravityFormFieldChoice[]
        defaultValue?: any
        placeholder?: string
        enableOtherChoice?: boolean
        multipleFiles?: boolean
        checkboxLabel?: string
        nextButton?: {
            text?: string
        }
        previousButton?: {
            text?: string
        }
    }

    // Form confirmation interface
    interface GravityFormConfirmation {
        type: 'message' | 'redirect' | 'page'
        message?: string
        url?: string
    }

    // Form interface
    interface GravityForm {
        title: string
        description?: string
        button?: {
            text: string
        }
        fields: GravityFormField[]
        confirmations?: Record<string, GravityFormConfirmation>
    }

    // Component props interface
    interface VueGravityFormsProps {
        endpoint: string
        formId: string | number
        apiKey?: string
        recaptchaKey?: string
    }

    // Export component
    export default DefineComponent<VueGravityFormsProps>
}

// Declare child components
declare module '@/components/form/TextField.vue'
declare module '@/components/form/TextareaField.vue'
declare module '@/components/form/SelectField.vue'
declare module '@/components/form/MultiselectField.vue'
declare module '@/components/form/RadioField.vue'
declare module '@/components/form/CheckboxField.vue'
declare module '@/components/form/DateTimeField.vue'
declare module '@/components/form/HiddenField.vue'
declare module '@/components/form/FileUploadField.vue'
declare module '@/components/form/SectionBreakField.vue'
declare module '@/components/form/AddressField.vue'
declare module '@/components/form/ImageChoiceField.vue'
