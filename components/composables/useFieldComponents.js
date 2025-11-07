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

// Post Field Components
import PostTitleField from "../form/PostTitleField.vue";
// import PostContentField from "../form/PostContentField.vue";
// import PostExcerptField from "../form/PostExcerptField.vue";
// import PostTagsField from "../form/PostTagsField.vue";
// import PostImageField from "../form/PostImageField.vue";
// import PostCustomField from "../form/PostCustomField.vue";

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
		name: NameField,

		// Post Fields
		post_title: PostTitleField
		// post_content: PostContentField,
		// post_excerpt: PostExcerptField,
		// post_tags: PostTagsField,
		// post_image: PostImageField,
		// post_custom_field: PostCustomField
	};

	const fieldComponents = computed(() => ({
		...defaultComponents,
		...customComponents
	}));

	return {
		fieldComponents
	};
}
