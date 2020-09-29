const converters = require('../../index');
const timeline = require('./mockTimeline');

const zoomTimelineConverter = converters.getConverterByName(
    converters.getConverters().zoom,
    timeline
);

(async () => {
    const converted = await zoomTimelineConverter.convert();
    console.log(JSON.stringify(converted, null, 4));
})();
