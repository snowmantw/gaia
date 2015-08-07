import React, { Component } from 'react'
import { connect } from 'redux/react'
import Wallpaper from '../components/Wallpaper'
import DateTime from '../components/DateTime'
import * as Actions from '../actions/Actions'
import MinuteTimer from '../services/MinuteTimer'

@connect(state => { return {
	wallpaper: state.wallpaper,
	dateTime: state.dateTime
}})
export default class ScreenKeeper {
	render() {
		const { wallpaper, dateTime, dispatch } = this.props;
		return (
		<div id='screenkeeper'>
			{(wallpaper !== null) ? <Wallpaper></Wallpaper> : null}
			{(dateTime !== null) ? <DateTime></DateTime> : null}
			// XXX: Need a meta-service to pack them
			<MinuteTimer></MinuteTimer>
			<DateTimeFormatterMonitor></DateTimeFormatterMonitor>
		</div>)
	}
	
}