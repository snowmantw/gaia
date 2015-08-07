import React, { PropTypes, Component } from 'react'
import * as Actions from '../actions/Actions'

export default class DateTimeFormatterMonitor extends Component {

	/**
	 * In services, UI is "doing effects", not only for view.
	 */
	render() {
		const { dispatch } = this.props
		dispatch(Actions.setFormatter(this.state.formatters))
		return ()	// Service needn't a view
	}
	
	handleEvent(event) {
		switch(event.type) {
			case 'moztimechange':
				this._fetchFormatters()
		}
	}

	componentDidMount() {
		this._fetchFormatters()
		// Since it's not really an UI event, we need to addEventListener here
		window.addEventListener('moztimechange', this)
	}
	
	componentWillUnmount() {
		window.removeEventListener('moztimechange', this)
	}
	
	/**
	 * First time we need to fetch them manually.
	 */
	_fetchFormatters() {
		var timeFormatter = new Intl.DateTimeFormat(navigator.languages, {
			hour12: navigator.mozHour12,
			hour: 'numeric',
			minute: 'numeric'
		})
		
		var dateFormatter = new Intl.DateTimeFormat(navigator.languages, {
			weekday: 'long',
			month: 'short',
			day: 'numeric'
		})
		this.setState({
			formatters: { time: timeFormatter, date: dateFormatter }
		})
	}
}