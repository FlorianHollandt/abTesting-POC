'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const database = require('./database')
const config = require('./config')

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');

const app = new App();

app.use(
    new Alexa(),
);


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
    async NEW_SESSION() {
        return this.ask(
            `Welcome to version ${config.custom.testingVersion}! `
            + `Do you like it?`
        );
    },

    async YesIntent() {
        this.$speech.addText(
            'Wonderful, thanks for the feedback. Bye!'
        );
        this.$data.isSatisfied = true;
        return this.toStatelessIntent('_recordSatisfactionStatus')
    },

    async NoIntent() {
        this.$speech.addText(
            'Thanks, your feedback helps us get better. Bye!'
        );
        this.$data.isSatisfied = false;
        return this.toStatelessIntent('_recordSatisfactionStatus')
    },

    async _recordSatisfactionStatus() {
        await database.recordObservation(
            this.$request.request.timestamp,
            config.custom.testingVersion,
            this.$data.isSatisfied
        );
        return this.tell(
            this.$speech
        );
    },

    async END() {
        return this.tell(
            'Thanks for checking in. Bye!'
        );
    }
});

module.exports.app = app;
