import React, { Component } from 'react'
import { connect } from 'redux/react'
import Wallpaper from '../components/Wallpaper'
import DateTime from '../components/DateTime'

@connect(state => {
	wallpaper: state.wallpaper,
	dateTime: state.dateTime
})
export default class ScreenKeeper {
	render() {
		const { wallpaper, dateTime, dispatch } = this.props;
		return (<Wallpaper >)
	}
}