const requireAll = require('require-all');
const path = require('path');
const fs = require('fs');

const TYPE = 'devices';

/**
 * A server to provide local devices resource.
 */
class OpenBlockDevice {

    constructor () {
        this.type = TYPE;
    }

    assembleData (userDataPath, formatMessage) {
        const devicesThumbnailData = [];

        const devices = requireAll({
            dirname: `${path.join(userDataPath, this.type)}`,
            filter: /index.js$/,
            recursive: true
        });

        // eslint-disable-next-line global-require
        const deviceList = require(path.join(userDataPath, this.type, 'device.js'));

        const parseDeviceList = [];
        deviceList.forEach(deviceId => {
            if (typeof deviceId === 'object') {
                deviceId.forEach(id => {
                    parseDeviceList.push(id);
                });
            } else {
                parseDeviceList.push(deviceId);
            }
        });

        parseDeviceList.forEach(deviceId => {
            let matched = false;
            Object.entries(devices).forEach(dev => {
                const translationsFile = path.join(userDataPath, this.type, dev[0], 'translations.js');
                let translations;
                if (fs.existsSync(translationsFile)) {
                    // eslint-disable-next-line global-require
                    const locales = require(translationsFile);
                    translations = locales.getInterfaceTranslations();
                    formatMessage.setup({
                        translations: translations
                    });
                }

                const content = dev[1]['index.js'](formatMessage);

                const processDeviceData = deviceData => {
                    if (deviceData.deviceId === deviceId) {

                        const basePath = path.join(this.type, dev[0]);

                        // Convert a local file path to a network address
                        if (deviceData.iconURL) {
                            deviceData.iconURL = path.join(basePath, deviceData.iconURL);
                        }
                        if (deviceData.connectionIconURL) {
                            deviceData.connectionIconURL = path.join(basePath, deviceData.connectionIconURL);
                        }
                        if (deviceData.connectionSmallIconURL) {
                            deviceData.connectionSmallIconURL = path.join(basePath,
                                deviceData.connectionSmallIconURL);
                        }
                        if (deviceData.main) {
                            deviceData.main = path.join(basePath, deviceData.main);
                        }
                        if (deviceData.translations) {
                            deviceData.translations = path.join(basePath, deviceData.translations);
                        }
                        if (deviceData.firmware) {
                            deviceData.firmware = path.join(basePath, deviceData.firmware);
                        }
                        if (deviceData.arduinoData) {
                            deviceData.arduinoData = path.join(basePath, deviceData.arduinoData);
                        }

                        matched = true;
                        devicesThumbnailData.push(deviceData);
                    }
                };

                // Support for multiple frameworks device data
                if (content.length > 1) {
                    content.forEach(deviceData => {
                        processDeviceData(deviceData);
                    });
                } else {
                    processDeviceData(content);
                }
            });
            if (!matched) {
                devicesThumbnailData.push({deviceId: deviceId});
            }
        });

        return devicesThumbnailData;
    }
}

module.exports = OpenBlockDevice;
