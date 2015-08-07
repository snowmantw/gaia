import * as types from '../constants/ActionTypes'

export function tickClock() {
	return {
		type: types.TICK_CLOCK
	}
}

export function setFormatter(formatters) {
	return {
		type: types.SET_FORMATTER,
		formatters
	}
}

export function changeWallpaper(imageBlobUrl) {
	return {
		type: types.CHANGE_WALLPAPER,
		imageBlobUrl
	}
}