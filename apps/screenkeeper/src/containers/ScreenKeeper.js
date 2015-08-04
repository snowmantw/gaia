import React, { Component } from 'react'
import { connect } from 'redux/react'
import Wallpaper from '../components/Wallpaper'
import DateTime from '../components/DateTime'

@connect(state => { return {
	wallpaper: state.wallpaper,
	dateTime: state.dateTime
}})
export default class ScreenKeeper {
	render() {
		const { wallpaper, dateTime, dispatch } = this.props;
		return (<div id='screenkeeper'>
			{(wallpaper !== null) ? <Wallpaper></Wallpaper> : null}
			{(dateTime !== null) ? <DateTime></DateTime> : null}
		</div>)
	}
}