// composables/useGridClass.js

/**
 * Maps a Gravity Forms field's 12-column layout grid span to the same
 * `gfield--width-*` class names Gravity Forms core itself uses
 * (see GF_Field::get_css_grid_class()).
 * @param {Object} field - The field configuration object
 * @returns {String} - The grid width class, or '' if no span/full row
 */
export function getGridColumnClass(field) {
	const span = Number(field?.layoutGridColumnSpan);

	switch (span) {
		case 12:
			return 'gfield--width-full';
		case 11:
			return 'gfield--width-eleven-twelfths';
		case 10:
			return 'gfield--width-five-sixths';
		case 9:
			return 'gfield--width-three-quarter';
		case 8:
			return 'gfield--width-two-thirds';
		case 7:
			return 'gfield--width-seven-twelfths';
		case 6:
			return 'gfield--width-half';
		case 5:
			return 'gfield--width-five-twelfths';
		case 4:
			return 'gfield--width-third';
		case 3:
			return 'gfield--width-quarter';
		default:
			return '';
	}
}
