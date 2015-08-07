import React, { PropTypes, Component } from 'react';

export default class Timer extends Component {
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