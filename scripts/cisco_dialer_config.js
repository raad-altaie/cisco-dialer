/*
 *   Cisco Dialer - Chrome Extension
 *   Copyright (C) 2015 Christian Volmering <christian@volmering.name>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var ciscoDialerConfig = new function () {
	this.lingualFields = {
		'pageTitle':               'options_title',
		'headerTitle':             'options_title',
		'phoneAddressLabel':       'options_label_phone_address',
		'phoneAddressDescription': 'options_description_phone_address',
		'authConfigLabel':         'options_label_auth_config',
		'authConfigDescription':   'options_description_auth_config',
		'authUser':                'options_placeholder_username',
		'authSecret':              'options_placeholder_password',
		'telUriLabel':             'options_label_telephony_uri',
		'telUriDescription':       'options_description_telephony_uri',
		'countryCodeLabel':        'options_label_country_code',
		'countryCodeDescription':  'options_description_country_code',
		'functionsLabel':          'options_label_functions',
		'contextMenuLabel':        'options_label_context_menu',
		'inPageDialLabel':         'options_label_inpage_dial',
		'saveConfig':              'options_button_save',
		'cancelConfig':            'options_button_cancel'
	};

	this.requiredFields = [
		'phoneAdress',
		'telephonyUri',
		'countryCode'
	];
	
	this.advancedFunctionsVisible = true;
	this.toggleAdvancedFunctions  = function () {
		this.advancedFunctionsVisible = !this.advancedFunctionsVisible;
		
		var label = chrome.i18n.getMessage('options_label_advanced_functions', [
			chrome.i18n.getMessage('options_state_'
				+ (this.advancedFunctionsVisible ? 'hide' : 'show'))
		]);
		
		document.getElementById('toggleAdvanced').innerHTML = label;
		document.getElementById('advancedFunctions').setAttribute('class',
			this.advancedFunctionsVisible ? 'show' : 'hide');
	};

	this.getCountryOptions = function (selected) {
		var options = selected ? '' : '<option>'
			+ chrome.i18n.getMessage('options_placeholder_country_code')
			+ '</option>';
			
		ciscoDialerCountryHelper.forEach(function (country) {
			options += '<option value="' + country.code 
				+ '"' + (country.code == selected ? ' selected' : '')
				+ '>' + country.name + '</option>';
		}, this);
		
		return options;
	};

	this.populateList = function (element, selected) {
		if (element.id == 'countryCode') {
			element.innerHTML = this.getCountryOptions(selected);
		} 
	};

	this.loadLocale = function () {
		for (var fieldName in this.lingualFields) {
			var message = chrome.i18n.getMessage(this.lingualFields[fieldName]);
			
			if (/placeholder/.test(this.lingualFields[fieldName])) {
				document.getElementById(fieldName).setAttribute('placeholder', message);
			}
			else if (this.lingualFields.hasOwnProperty(fieldName)) {
				document.getElementById(fieldName).innerHTML = message;
			}
		}
	};

	this.restore = function () {
		for (var option in ciscoDialer.configOptions) {
			var value = ciscoDialer.configOptions[option];
			var element = document.getElementById(option);
			
			if (element !== undefined) {
				if (element.nodeName.toLowerCase() == 'select') {
					this.populateList(element, value);
				}
				else if (element.getAttribute('type') == 'checkbox') {
					element.checked = value == 'true';
				}
				else {
					element.value = /Secret/.test(option) 
						? (value ? ciscoDialer.decryptSecret(value) : '') : value;
				}
			}
		}

		this.changed();
	};

	this.valid = function () {
		for (var index = 0, size = this.requiredFields.length; index < size; index++) {
			if (!document.getElementById(this.requiredFields[index]).value.trim()) {
				return false;
			}
		}
		
		return true;
	};

	this.changed = function () {
		var saveButton = document.getElementById('saveConfig');
		
		if (!this.valid()) {
			saveButton.setAttribute('disabled', '');
		}
		else {
			saveButton.removeAttribute('disabled');
		}
	};

	this.save = function () {
		if (!this.valid()) {
			return;
		}
		
		for (var option in ciscoDialer.configOptions) {
			var element = document.getElementById(option);
			var value = element !== undefined 
				? element.value : ciscoDialer.configOptions[option];
			
			if (element.getAttribute('type') == 'checkbox') {
				value = element.checked ? 'true' : 'false';
			}
			
			ciscoDialer.configOptions[option] = /Secret/.test(option)
				? ciscoDialer.encryptSecret(value) : value.trim();
		}
		
		chrome.storage.sync.set(ciscoDialer.configOptions, function () {
			var statusMessage = document.getElementById('statusMessage');
			
			statusMessage.innerHTML = chrome.i18n.getMessage('options_saved');
			setTimeout(function () {
				statusMessage.innerHTML = '';
				window.close();
			}, 1250);
		}.bind(this));
	};

	this.cancel = function () {
		this.restore();
		window.close();
	};

	this.onContentLoaded = function () {
		this.loadLocale();
		this.toggleAdvancedFunctions();
		
		for (var index = 0, size = this.requiredFields.length; index < size; index++) {
			document.querySelector('#' + this.requiredFields[index]).addEventListener(
				'input', this.changed.bind(this));
		}
		
		this.restore();
		
		document.querySelector('#toggleAdvanced').addEventListener(
			'click', this.toggleAdvancedFunctions.bind(this));
		document.querySelector('#saveConfig').addEventListener(
			'click', this.save.bind(this));
		document.querySelector('#cancelConfig').addEventListener(
			'click', this.cancel.bind(this));
		
		ciscoDialer.notifyOnChange(this.restore.bind(this));
	};

	document.addEventListener('DOMContentLoaded', this.onContentLoaded.bind(this), false);
}