import React, { Component } from 'react'
import { createRedux } from 'redux'
import { Provider } from 'redux/react'
import ScreenKeeper from './ScreenKeeper'
import dateTime from '../stores/dateTime'
import wallpaper from '../stores/wallpaper'

const redux = createRedux({ dateTime, wallpaper })

export default class App extends Component {
	render() {
		return (
			<Provider redux={redux}>
				{()=> <ScreenKeeper />}
			</Provider>
		)
	}
}
