import { CHANGE_WALLPAPER } from '../constants/ActionTypes'
const initialState = null 	// XXX: need to make it as a formal 'new NullStore'

export default function wallpaper(state = initialState, action) {
	switch (action.type) {
		case CHANGE_WALLPAPER:
			return { imageBlobUrl: action.imageBlobUrl }
		default:
			return state
	}
}
