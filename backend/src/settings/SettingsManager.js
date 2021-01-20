
module.exports = class SettingsManager {
	constructor() {
		this._settings = {
			allowTrackingUsageData: false
		};
	}

	get settings() {
		return this._settings;
	}

	set settings(settings) {
		Object.assign(this._settings, settings);
	}

	updateSettings(settings) {
		this.settings = settings;
	}
};
