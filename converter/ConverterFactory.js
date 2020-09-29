const converters = {
    'zoom': require('./zoom')
};

const ConverterFactory = class {
    constructor() {
        this.getConverters = this.getConverters.bind(this);
        this.getConverterByName = this.getConverterByName.bind(this);
    }

    /**
     * Get a list of converters for supported platforms
     * @returns {{zoom: string}} - Map of supported converters
     */
    getConverters() {
        return {
            zoom: 'zoom',
        };
    }

    /**
     * Get a new instance of converter by it's name and initialize it
     * @param converterName - The name of the converter
     * @param data - Required data to initialize converter
     * @returns converter - The initialized converter
     */
    getConverterByName(converterName, data) {
        if (!!converters[converterName]) {
            return new converters[converterName](data);
        } else {
            throw new Error(`Unsupported platform: ${converterName}, Supported platforms are: ${this.getConverters().join(', ')}`);
        }
    }
};

module.exports = ConverterFactory;
