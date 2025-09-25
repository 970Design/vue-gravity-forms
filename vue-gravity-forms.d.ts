declare module '@/components/VueGravityForms.vue' {
    import { DefineComponent } from 'vue'

    export interface VueGravityFormsProps {
        endpoint: string;
        formId: number;
        wpAppPassword: string;
        wpUsername: string;
        recaptchaKey?: string;
    }

    const VueGravityForms: DefineComponent<VueGravityFormsProps>
    export default VueGravityForms
}