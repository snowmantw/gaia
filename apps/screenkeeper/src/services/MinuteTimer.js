import React, { PropTypes, Component } from 'react'
import * as Actions from '../actions/Actions'

export default class MinuteTimer extends Component {

	/**
	 * In services, UI is "doing effects", not only for view.
	 */
	render() {
		const { dispatch } = this.props
		dispatch(Actions.tickClock())
		return ()	// Service needn't a view
	}

	componentDidMount() {
		var seconds = (new Date()).getSeconds()
		if (0 === seconds) {
			this._tick()
		} else {
			// We must manually do it once without recursion,
			// so the first ticking will happen after the left ms,
			// not when we call the `_tick`.
			this._tickId = window.setTimeout(() => {
				this._tick()
			}, this._leftMilliseconds())
		}
	}
	
	componentWillUnmount() {
		window.clearTimeout(this._tickId)
	}
	
	_leftMilliseconds() {
		var seconds = (new Date()).getSeconds()
		var leftMilliseconds = (60 - seconds) * 1000
		return leftMilliseconds
	}
	
	_tick() {
		this.setState({})
		this._tickId = window.setTimeout(() => {
			this._tick()	// rec
		}, this._leftMilliseconds())
	}
	
}