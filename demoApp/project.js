// ------------------------------------------------------------------
// JOVO PROJECT CONFIGURATION
// ------------------------------------------------------------------

require('dotenv').config();

module.exports = {
	alexaSkill: {
		nlu: {
			name: 'alexa',
		},
		manifest: {
			privacyAndCompliance: {
				locales: {
					'en-US': {
						privacyPolicyUrl: "",
						termsOfUseUrl: ""
					}
				},
				allowsPurchases: false,
				usesPersonalInfo: false,
				isChildDirected: false,
				isExportCompliant: true,
				containsAds: false
			},
			publishingInformation: {
				locales: {
					'en-US': {
						name: 'A/B-Testing Demo',
						summary: "This Skill demos the possible setup of an A/B-test",
						description: "This Skill demos the possible setup of an A/B-test",
						examplePhrases: [
							"Alexa open Testing Demo"
						],
						smallIconUri: "https://dicechampionship.s3-eu-west-1.amazonaws.com/icons/abTest_small.png",
						largeIconUri: "https://dicechampionship.s3-eu-west-1.amazonaws.com/icons/abTest_large.png",
						keywords: [
							"test"
						],
					},
				},
				isAvailableWorldwide: true,
				testingInstructions: "Sample testing instructions",
				category: "GAMES",
				distributionCountries: []
			},
		},
		skillId: process.env.SKILL_ID,
		askProfile: process.env.ASK_PROFILE
	},
	defaultStage: 'console',
	stages: {
		console: {
			endpoint: process.env.LAMBDA_ARN_ROUTER,
			deploy: {
				target: [
					'info',
					'model'
				],
			},
		},
		versionA: {
         endpoint: process.env.LAMBDA_ARN_VERSION_A,
			deploy: {
				target: [
					'lambda',
				],
			},
		},
		versionB: {
         endpoint: process.env.LAMBDA_ARN_VERSION_B,
			deploy: {
				target: [
					'lambda',
				],
			},
		},
	},
};