import React, { PropTypes, Component } from 'react';

export default class DateTime extends Component {
	static propTypes = {
		timeFormatter: PropTypes.instanceOf(Intl.DateTimeFormat).isRequired,
		dateFormatter: PropTypes.instanceOf(Intl.DateTimeFormat).isRequired,
		now: PropTypes.instanceOf(Date).isRequired,
		amPm: PropTypes.string.isRequired
	}
	
	render() {
		return (
			<div id='screenkeeper-datetime'>
				{this.renderTime}
				{this.renderDate}
			</div>
		)
	}

	renderTime() {
		return (
			<div id='screenkeeper-datetime-time'>
				{this.props.timeFormatter
					 .format(now)
					 .replace(this.props.amPm)
					 .trim()}
			</div>
		)
	}
	
	renderDate() {
		return  (
			<div id='screenkeeper-datetime-date'>
				{this.props.dateFormatter.format(now)}
			</div>
		)
	}
}
