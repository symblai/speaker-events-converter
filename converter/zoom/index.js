const fs = require('fs');

const ZoomConverter = class {
    constructor(data = {}) {
        const { timeline } = data;

        if (!timeline) {
            throw new Error(`'timeline' needs to be a passed as a valid file path or JSON`);
        }

        this.validateTimeline = this.validateTimeline.bind(this);
        this.validateTimelineEvents = this.validateTimelineEvents.bind(this);

        if (typeof timeline === 'string') {
            try {
                this.timeline = JSON.parse(timeline);
            } catch (e) {
                if (fs.existsSync(timeline)) {
                    const timelineData = fs.readFileSync(timeline, {encoding: 'utf-8'}).toString();
                    try {
                        this.timeline = JSON.parse(timelineData);
                    } catch (e) {
                        throw new Error(`Timeline file at ${timeline} has invalid JSON data`);
                    }
                } else {
                    throw new Error(`Timeline file: ${timeline} not found and is neither a valid JSON object`);
                }
            }
        } else if (typeof timeline === 'object') {
            this.timeline = timeline;
        } else {
            throw new Error(`Unexpected type: ${typeof timeline} for timeline`);
        }

        this.validateTimeline(this.timeline);

        this.activeSpeakers = {};
        this.speakerEvents = [];
    }

    validateTimeline(timelineData) {
        const { timeline } = timelineData;
        if (Array.isArray(timelineData)) {
            return this.validateTimelineEvents(timelineData);
        } else if (timeline) {
            this.timeline = timeline;
            return this.validateTimelineEvents(timeline);
        } else {
            throw new Error(`'timeline' needs to passed as an object enclosing the array 'timeline' or the array itself`);
        }
    }

    validateTimelineEvents(timeline) {
        let invalidIndex = -1;
        const isValid = timeline.every((data, index) => {
            invalidIndex = index;
            return data.ts && data.users && Array.isArray(data.users);
        });

        if (!isValid) {
            throw new Error(`timeline contains invalid data at index: ${invalidIndex}`);
        }

        return true;
    }

    getSecondsAndNanos(_nanos) {
        _nanos = Math.trunc(_nanos);
        let _seconds = _nanos * Math.pow(10, -9);
        let secondsAndNanos = _seconds.toFixed(9).split('.');

        return {
            seconds: parseInt(secondsAndNanos[0]),
            nanos: parseInt(secondsAndNanos[1] || '0')
        };
    }

    generateStoppedSpeakingEvents(offset) {
        Object.values(this.activeSpeakers).forEach(activeSpeaker => {
            this.speakerEvents.push({
                type: 'stopped_speaking',
                user: {
                    id: activeSpeaker.user_id || activeSpeaker.zoom_userid,
                    name: activeSpeaker.username,
                    email: activeSpeaker.email_address
                },
                offset
            })
        });
    }

    extractEvents(activeEvents) {
        const condensedTimeline = [];
        activeEvents.forEach(activeEventKey => {
            const activeEvent = this.activeSpeakers[activeEventKey];

            if (activeEvent.started && activeEvent.stopped) {
                if (parseFloat(`${activeEvent.stopped.offset.seconds}.${activeEvent.stopped.offset.nanos}`) - parseFloat(`${activeEvent.started.offset.seconds}.${activeEvent.started.offset.nanos}`) > 0.5) {
                    condensedTimeline.push(activeEvent.started);
                    condensedTimeline.push(activeEvent.stopped);
                }

                delete this.activeSpeakers[activeEventKey];
            }
        });

        return condensedTimeline;
    }

    calculateOffset(ts) {
        const duration = ts
            .split(':')
            .map((t, i) => {
                let parsedTime = parseFloat(t);
                switch (i) {
                    case 0:
                        parsedTime *= 3600;
                        break;
                    case 1:
                        parsedTime *= 60;
                        break;
                }

                return parsedTime;
            })
            .reduce((previousValue, currentValue) => {
                return previousValue + currentValue;
            });

        return this.getSecondsAndNanos(duration * Math.pow(10, 9));
    }

    adjustStoppedOffsets(condensedTimeline) {
        for (let i = 0; i < condensedTimeline.length; i++) {
            const currentEvent = condensedTimeline[i];
            const nextEvent = condensedTimeline[i + 1];

            if (nextEvent &&
                currentEvent.user.id !== nextEvent.user.id &&
                currentEvent.type === 'stopped_speaking' && nextEvent.type === 'started_speaking') {

                const difference = parseFloat(`${nextEvent.offset.seconds}.${nextEvent.offset.nanos}`) - parseFloat(`${currentEvent.offset.seconds}.${currentEvent.offset.nanos}`)
                if (difference > 0.75) {
                    condensedTimeline[i] = {
                        ...currentEvent,
                        offset: nextEvent.offset
                    }
                }
            }
        }

        return condensedTimeline;
    }

    condenseTimeline(speakerEvents) {
        let index = 0;
        let condensedTimeline = [];
        this.activeSpeakers = {};

        while (index < speakerEvents.length) {
            const speakerEvent = speakerEvents[index];

            if (!this.activeSpeakers[speakerEvent.user.id] && speakerEvent.type === 'started_speaking') {
                this.activeSpeakers[speakerEvent.user.id] = { started: speakerEvent };
            }

            if (speakerEvent.type === 'stopped_speaking' && this.activeSpeakers[speakerEvent.user.id]) {
                this.activeSpeakers[speakerEvent.user.id].stopped = speakerEvent;
            }

            const activeEvents = Object.keys(this.activeSpeakers);
            if (activeEvents.length > 1) {
                condensedTimeline.push(...this.extractEvents(activeEvents));
            }

            index += 1;
        }

        condensedTimeline.push(...this.extractEvents(Object.keys(this.activeSpeakers)));

        return condensedTimeline;
    }

    /**
     * Convert a Zoom timeline to Speaker API request body
     * @returns {speakerEvents}
     */
    async convert() {
        for (let i = 0; i < this.timeline.length; i++) {
            const timeline = this.timeline[i];
            const nextTimeline = this.timeline[i + 1];

            const { ts, users } = timeline;

            const offset = this.calculateOffset(ts);

            users.slice(0, 1).forEach(user => {
                const speakerEvent = {
                    user: {
                        id: user.user_id || user.zoom_userid,
                        name: user.username,
                        email: user.email_address
                    },
                    offset
                };

                if (!this.activeSpeakers[user.user_id]) {
                    this.generateStoppedSpeakingEvents(offset);

                    this.speakerEvents.push({...speakerEvent, type: "started_speaking"});

                    this.activeSpeakers = {};

                    this.activeSpeakers[user.user_id] = user;
                } else {
                    speakerEvent.type = "stopped_speaking";
                    delete this.activeSpeakers[user.user_id];

                    if (nextTimeline) {
                        this.speakerEvents.push({...speakerEvent, offset: this.calculateOffset(nextTimeline.ts)});
                    } else {
                        this.speakerEvents.push({...speakerEvent});
                    }

                    if (nextTimeline && nextTimeline.users.slice(0, 1).findIndex(userObject => userObject.user_id === user.user_id) > -1) {
                        this.activeSpeakers[user.user_id] = user;
                        this.speakerEvents.push({...speakerEvent, type: 'started_speaking'});
                    }
                }
            });

            if (users.length <= 0) {
                this.generateStoppedSpeakingEvents(offset);
                this.activeSpeakers = {};
            }
        }

        let condensedTimeline = this.condenseTimeline(this.speakerEvents);

        condensedTimeline = this.adjustStoppedOffsets(this.condenseTimeline(condensedTimeline));

        return {
            speakerEvents: condensedTimeline
        };
    }
};

module.exports = ZoomConverter;
