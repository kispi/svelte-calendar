import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';

/**
 * @param {HTMLInputElement} node
 * @param {import('flatpickr/dist/types/options').Options} options
 */
export function flatpicker(node, options) {
    const minTime = options.minTime || null;
    const defaultDate = options.defaultDate || null;

    // @ts-ignore
    const fp = flatpickr(node, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        minuteIncrement: 15,
        defaultDate: defaultDate,
        minTime: minTime,
        ...options,
        onChange: (selectedDates, dateStr, instance) => {
            // Dispatch input event for Svelte binding
            node.value = dateStr;
            node.dispatchEvent(new Event('input'));
        }
    });

    return {
        /** @param {import('flatpickr/dist/types/options').Options} newOptions */
        update(newOptions) {
            // @ts-ignore
            fp.set(newOptions);
        },
        destroy() {
            fp.destroy();
        }
    };
}
