import { computed } from 'vue';
import TextField from "../form/TextField.vue";
import TextareaField from "../form/TextareaField.vue";
import SelectField from "../form/SelectField.vue";
import MultiselectField from "../form/MultiselectField.vue";
import RadioField from "../form/RadioField.vue";
import CheckboxField from "../form/CheckboxField.vue";
import DateTimeField from "../form/DateTimeField.vue";
import HiddenField from "../form/HiddenField.vue";
import FileUploadField from "../form/FileUploadField.vue";
import SectionBreakField from "../form/SectionBreakField.vue";
import AddressField from "../form/AddressField.vue";
import ImageChoiceField from "../form/ImageChoiceField.vue";
import NameField from "../form/NameField.vue";

export function useFieldComponents(customComponents) {
	const defaultComponents = {
		text: TextField,
		number: TextField,
		phone: TextField,
		website: TextField,
		password: TextField,
		email: TextField,
		textarea: TextareaField,
		select: SelectField,
		multiselect: MultiselectField,
		radio: RadioField,
		checkbox: CheckboxField,
		datetime: DateTimeField,
		hidden: HiddenField,
		fileupload: FileUploadField,
		section: SectionBreakField,
		address: AddressField,
		image_choice: ImageChoiceField,
		name: NameField
	};

	const fieldComponents = computed(() => ({
		...defaultComponents,
		...customComponents
	}));

	return {
		fieldComponents
	};
}
