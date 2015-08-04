import { TICK_CLOCK, SET_FORMATTER } from '../constants/ActionTypes'
const initialState = null	// XXX: need to make it as a formal 'new NullStore'

export default function dateTime(state = initialState, action) {
	switch (action.type) {
		case TICK_CLOCK:
			// Not init from setting values yet
			if (null === state) { return state }
			
			state.now = new Date()
			return state
		case SET_FORMATTER:
			if (null === state) {
				state = setupState(action.formatters);
			} else {
				state.timeFormatter = action.formatters.time
				state.dateFormatter = action.formatters.date
				state.now = new Date()	// first time get it
				state.amPm = state.now.toLocalFormat('%p')
			}
			return state
		default:
			return state
	}
}