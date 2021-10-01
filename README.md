# SPEAKER EVENTS CONVERTER


[![Websocket](https://img.shields.io/badge/symbl-websocket-brightgreen)](https://docs.symbl.ai/docs/streamingapi/overview/introduction)

Symbl's APIs empower developers to enable: 
- **Real-time** analysis of free-flowing discussions to automatically surface highly relevant summary discussion topics, contextual insights, suggestive action items, follow-ups, decisions, and questions.
- **Voice APIs** that makes it easy to add AI-powered conversational intelligence to either [telephony][telephony] or [WebSocket][websocket] interfaces.
- **Conversation APIs** that provide a REST interface for managing and processing your conversation data.
- **Summary UI** with a fully customizable and editable reference experience that indexes a searchable transcript and shows generated actionable insights, topics, timecodes, and speaker information.

<hr />

# This Guides Purpose is for Demonstaration of How To Convert A Zoom Timeline To Symbl.ai Speaker Events

<hr />

 * [Setup](#setup)
 * [Usage](#usage)
 * [Community](#community)
 
## Setup 
The first step to getting setup is to [sign up with Symbl.ai][signup]. 

You will need a [Zoom](https://zoom.us/) account with a Business package version or higher.  

### Configure Zoom
1. Under Account Settings > Advanced cloud recording settings, check the box which states `Add a timestamp to the recording`.  This setting will allow an export of the required Zoom Timeline for any recorded Zoom meeting.  
2. Using the [Zoom GET Recordings API](https://marketplace.zoom.us/docs/api-reference/zoom-api/cloud-recording/recordingget) retreive the timeline using the Zoom meeting Id.  There may be multiple files listed when making a request to this API. You will need the file with `"file_type": "TIMELINE"`.  A download link will be provided in the response.  

## Usage

1. Download the timeline per instructions in the Configure Zoom section, and save the output file into the example/zoom directory as a .json file.  
2. Update line 2 of the `index.js` file in the example/zoom directory `const timeline = require('./mockTimeline');` to require your .json file from step 1.
3. cd into the example/zoom directory and run `node index.js`.  The Symbl.ai formatted timeline will be output to console.  
4. Use the output to make a request to the Symbl [Speaker Events](https://docs.symbl.ai/docs/conversation-api/speaker-events) API for the corresponding Symbl Conversation ID to update the transcript with speaker information.  

- NOTE: This repo is intended only as a proof of concept for how to transform a Zoom Timeline into a Sybml.ai consumable format.  Full integration of this process may use the logic in the `converter/ConverterFactory.js` file as reference. 

## Community 

If you have any questions, feel free to reach out to us at devrelations@symbl.ai, through our Community [Slack][slack], or [developer community][developer_community]

This guide is actively developed, and we love to hear from you! Please feel free to [create an issue][issues] or [open a pull request][pulls] with your questions, comments, suggestions and feedback.  If you liked our integration guide, please star our repo!

This library is released under the [MIT License][license]

[license]: LICENSE.txt
[telephony]: https://docs.symbl.ai/docs/telephony/overview/post-api
[websocket]: https://docs.symbl.ai/docs/streamingapi/overview/introduction
[developer_community]: https://community.symbl.ai/?_ga=2.134156042.526040298.1609788827-1505817196.1609788827
[signup]: https://platform.symbl.ai/?_ga=2.63499307.526040298.1609788827-1505817196.1609788827
[issues]: UPDATE
[pulls]: UPDATE
[slack]: https://join.slack.com/t/symbldotai/shared_invite/zt-4sic2s11-D3x496pll8UHSJ89cm78CA