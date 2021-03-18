import IbPwaController from './IbPwaController.js';
import IbPwaDebug from './IbPwaDebug.js';
import IbPwaStorage from './IbPwaStorage.js';

export const IbPwaUiService = class {
	static postMessage(target, message) {
		IbPwaDebug.log(">>> [IbPwaUiService] postMessage()...");
		IbPwaDebug.log(message);
		
		if (target) {
			target.postMessage(message);
		} else {
			IbPwaDebug.log("!!! [IbPwaUiService] target is not found");
		}

		IbPwaDebug.log("<<< [IbPwaUiService] postMessage()...OK");
	}

    static async getImageInfo() {
		const info = await IbPwaController.request(IbPwaController.requestType.image)
		.then(jsonInfo => {
			if (jsonInfo && jsonInfo != void 0) {
				const json = JSON.parse(jsonInfo);
				IbPwaDebug.log("*** [IbPwaUiService] getImageInfo is succeeded");
				IbPwaDebug.log(json);
				return json;	
			}
			return null;
		})
		.catch(e => {
			IbPwaDebug.log("!!! [IbPwaUiService] request is failure");
			IbPwaDebug.log(e);
			return null;
		});

		return info;
	}

    static async loadImageFromServer(file) {
		// Get the specified file from the app.
		// If there is no specified file, it will be the specified image.
		// The return value is the image binary data.

		let path = IbPwaController.requestType.imageSpecify + file;
		const binary = await IbPwaController.request(path)
		.then(([contentType, buffer]) => {
			const bytes = new Uint8Array(buffer);
			const blobUrl = URL.createObjectURL(new Blob([bytes], { type: contentType }));
			return blobUrl;
		})
		.catch(e => {
			IbPwaDebug.log("!!! [IbPwaUiService] request is failure");
			IbPwaDebug.log(e);
			return null;
		});

		return binary;
	}

    static getDataUri(contentType, arrayBuffer) {
		const bytes = new Uint8Array(arrayBuffer);
		var binary = "";
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}

		if (binary) {
			return `data:${contentType};base64,` + btoa(binary);
		} else {
			IbPwaDebug.log("!!! [IbPwaUiService] getDataUri no binary");
		}

		return null;
	}

    static saveBackgroundImageOfServer(file) {
		let path = IbPwaController.requestType.imageSpecify + file;
		IbPwaController.request(path)
		.then(([contentType, buffer]) => {
			const dataUri = this.getDataUri(contentType, buffer);
			if (dataUri) {
				IbPwaStorage.setItem(file, dataUri);
				IbPwaDebug.log(`*** [IbPwaUiService] saveBackgroundImageOfServer(${file}) is succeeded`);	
			} else {
				IbPwaDebug.log("!!! [IbPwaUiService] saveBackgroundImageOfServer failed to request");	
			}
		})
		.catch(e => {
			IbPwaDebug.log("!!! [IbPwaUiService] request is failure");
			IbPwaDebug.log(e);
		});
	}

    static saveBackgroundImages(file) {
		const url = `../images/${file}`;
		IbPwaController.requestExternal(url)
		.then(res => {
			const contentType = res.headers.get("Content-type");
			res.arrayBuffer()
			.then(buffer => {
				const dataUri = this.getDataUri(contentType, buffer);
				if (dataUri) {
					IbPwaStorage.setItem(file, dataUri);
					IbPwaDebug.log(`*** [IbPwaUiService] saveBackgroundImage(${file}) is succeeded`);	
				} else {
					IbPwaDebug.log("!!! [IbPwaUiService] saveBackgroundImage failed to request");	
				}
			})
			.catch(e => {
				IbPwaDebug.log("!!! [IbPwaUiService] saveBackgroundImages is failure of ArrayBuffer");
				IbPwaDebug.log(e);	
			});	
		})
		.catch(e => {
			IbPwaDebug.log("!!! [IbPwaUiService] requestExternal is failure");
			IbPwaDebug.log(e);	
		});
	}

    static getOrderedBackgroundImageInfo(imageInfo) {
		if (imageInfo == null) {
			IbPwaDebug.log("*** [IbPwaUiService] imageInfo is null in getBackgroundImageInfo");
			return null;
		}

        try {
            let validImages = [];
            const sortedBackgrounds = imageInfo.backgrounds.sort((a, b) => {a.order - b.order});
            for (const bg of sortedBackgrounds) {
                if (IbPwaStorage.hasKey(bg.name)) {
                    validImages.push(bg);
                }
            }
    
            return validImages;
        } catch(e) {
            IbPwaDebug.log("!!! [IbPwaUiService] getBackgroundImageInfo is failure");
			IbPwaDebug.log(e);
        }

        return null;
	}
};