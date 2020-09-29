const converters = require('../../index');
const timeline = require('./mockTimeline');

const zoomConverter = converters.getConverterByName(
    converters.getConverters().zoom,
    timeline
);

(async () => {
    const converted = await zoomConverter.convert();
    console.log(JSON.stringify(converted, null, 4));
})();
